interface GreenScreenWrapperProps {
  children: React.ReactNode;
  mode: 'lite' | 'dark';
}

const GreenScreenWrapper = ({ children, mode }: GreenScreenWrapperProps) => {
  const bgColor = 'bg-[#00ff00]'; // Pure green for chroma key
  const textColor = mode === 'lite' ? 'text-black' : 'text-white';
  
  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-8`}>
      <style>
        {`
          /* Override all colors for green screen mode */
          .green-screen * {
            background-color: transparent !important;
            border-color: ${mode === 'lite' ? '#000000' : '#ffffff'} !important;
            color: ${mode === 'lite' ? '#000000' : '#ffffff'} !important;
          }
          
          .green-screen button {
            background-color: ${mode === 'lite' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} !important;
            border: 2px solid ${mode === 'lite' ? '#000000' : '#ffffff'} !important;
          }
          
          .green-screen button:hover {
            background-color: ${mode === 'lite' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'} !important;
          }
          
          .green-screen input {
            background-color: ${mode === 'lite' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} !important;
            border: 2px solid ${mode === 'lite' ? '#000000' : '#ffffff'} !important;
          }
        `}
      </style>
      <div className="green-screen max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default GreenScreenWrapper;