import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";

const Header = () => {
  return (
    <header className="sticky top-0 z-20 bg-white shadow-md">
      {/* Topbar */}
      <div className="z-0 relative">
        <Topbar />
      </div>

      {/* Navbar */}
      <div className="z-0 relative">
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
