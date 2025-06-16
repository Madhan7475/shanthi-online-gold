import Banner from "../Common/Banner";
import Header from "../Common/Header";
import Footer from "../Common/Footer";
import Category from "../Common/Category.jsx";
import GoldProductList from "../Products/GoldProductsList"; 

const UserLayout = () => {
  return (
    <>
        {/* Header */}
        <Header> </Header>
        {/* Main */}
        <Banner></Banner>
        {/* body */}
        <Category></Category>
        {/* Products */}
        <GoldProductList></GoldProductList>
        {/* Footer */}
        <Footer></Footer>
    </>
  );
};

export default UserLayout