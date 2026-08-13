-- 支持匿名（访客）登录：匿名用户既无邮箱也无 full_name 元数据，
-- profiles.full_name 为 NOT NULL，触发器需要兜底默认名，
-- 否则 signInAnonymously 会因触发器插入失败而整体报错。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      '访客'
    )
  );
  RETURN NEW;
END;
$$;
