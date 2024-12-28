import { Nav } from '../nav';
import { SignIn } from '../sign-in';

export const Header = () => {
  return (
    <header className="bg-background py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <h1>eoss Base Next App</h1>
        <Nav>
          <SignIn />
        </Nav>
      </div>
    </header>
  );
};
