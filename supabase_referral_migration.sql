-- 1. Create the referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES public.profiles(id) NOT NULL,
    referred_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on the new table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id);

-- Policy: Users can insert their own referrals
CREATE POLICY "Users can insert their own referrals" 
ON public.referrals FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

-- 2. Create the trigger function to award points
CREATE OR REPLACE FUNCTION handle_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_user_email TEXT;
BEGIN
  -- We ONLY want to give the bonus if a new user completes a service
  -- If points were awarded for service_completed, and amount > 0:
  IF NEW.reason = 'service_completed' AND NEW.amount > 0 THEN
    
    -- Look up the email of the user who just completed the service
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    -- Check if this user's email was referred by someone and is still pending
    SELECT id, referrer_id INTO v_referral_id, v_referrer_id
    FROM public.referrals
    WHERE LOWER(referred_email) = LOWER(v_user_email) 
      AND status = 'pending'
    LIMIT 1;

    -- If a pending referral exists, give the referrer their bonus
    IF v_referrer_id IS NOT NULL THEN
      -- Create a referral bonus transaction for the referrer (50 points)
      INSERT INTO public.point_transactions (user_id, amount, reason)
      VALUES (v_referrer_id, 50, 'referral_bonus');

      -- Update the referrer's total points in their profile
      UPDATE public.profiles
      SET reward_points = reward_points + 50
      WHERE id = v_referrer_id;

      -- Mark the referral as completed so it doesn't trigger again
      UPDATE public.referrals
      SET status = 'completed', completed_at = NOW()
      WHERE id = v_referral_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to point_transactions
DROP TRIGGER IF EXISTS trigger_handle_referral_bonus ON public.point_transactions;

CREATE TRIGGER trigger_handle_referral_bonus
AFTER INSERT ON public.point_transactions
FOR EACH ROW EXECUTE FUNCTION handle_referral_bonus();
