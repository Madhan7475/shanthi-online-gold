import { auth } from "../firebase/firebaseConfig";

export const setupAuthListener = () => {
  auth.onIdTokenChanged(async (user) => {
    if (user) {
      const token = await user.getIdToken(true); // force refresh
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: user.email,
          phone: user.phoneNumber,
          name: user.displayName,
          uid: user.uid,
        })
      );
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  });
};
