import React from 'react';
import Sidebar from './Sidebar';
import ContentArea from './ContentArea';
import HolodeckView from './HolodeckView';

const Layout = () => {
  return (
    <div className="Layout">
      <Sidebar />
      <ContentArea>
        <HolodeckView />
      </ContentArea>
    </div>
  );
};

export default Layout;
