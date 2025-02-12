import Navbar from "./navbar";
import ServicesSection from "./ServicesSection";
import  './index.css';
import WelcomSection from "./welcomSection";
import Footer from "./footer"
import UploadSection from "./UploadSection";
function App() {

  return (
    <>
      <Navbar />
      <UploadSection />
      <ServicesSection />
      <Footer/>
    </>
  );
}

export default App;
