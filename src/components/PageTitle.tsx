import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  useEffect(() => {
    // Update the document title when the component mounts or title changes
    document.title = `GSB - ${title}`;
    
    // Reset to default title when component unmounts
    return () => {
      document.title = 'GSB Rapports';
    };
  }, [title]);

  // This component doesn't render anything visible
  return null;
};

export default PageTitle; 