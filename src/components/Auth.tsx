import { auth, googleProvider } from "../firebase/firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const Auth = () => {
  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={signIn}>Sign in with Googlell</button>
      <button onClick={() => signOut(auth)}>Sign Out</button>
    </div>
  );
};

export default Auth;
