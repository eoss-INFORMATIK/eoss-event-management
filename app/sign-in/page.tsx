import { SignIn } from '@/components/sign-in';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Willkommen</h1>
          <p className="text-muted-foreground text-sm">
            Melde dich bei deinem Konto an
          </p>
        </div>
        <SignIn error={error} redirectTo={redirectTo} />
      </div>
    </div>
  );
}
