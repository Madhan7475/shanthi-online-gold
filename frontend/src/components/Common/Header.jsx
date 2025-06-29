import Topbar from "../Layout/Topbar"
import Navbar from "./Navbar"

const Header = () => {
  return (
    <header>
        {/* Topbar */}
        <Topbar></Topbar>
        {/* Navbar */}
        <Navbar></Navbar>
        {/* Cart Drawer */}
    </header>
  )
}

export default Header