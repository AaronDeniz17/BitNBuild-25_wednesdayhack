// Layout component for GigCampus
// Main layout wrapper with header and footer

import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, showHeader = true, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
