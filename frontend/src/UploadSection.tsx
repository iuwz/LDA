import { Upload } from 'lucide-react';

const SimpleUpload = () => {
  return (
    <div className="flex items-center justify-center space-x-3 m-8">
      <h1 className="text-6xl text-[#2C2C4A] font-serif">Upload Your File</h1>
      <Upload size={60} className="text-[#C17829] stroke-[#C17829]" />
    </div>
  );
};

export default SimpleUpload;
