import PlatformCodeEditor from '@/modules/problems/components/PlatformCodeEditor';

const ProblemsPage = () => {
  return (
    <div className='relative flex min-h-0 flex-1 flex-col overflow-y-auto'>
      <div className='absolute inset-0 -z-10 h-full w-full bg-[#FFFFFF] bg-[url("/textures/grid-me.png")] bg-repeat'></div>
      <PlatformCodeEditor
        title='Two Sum'
        description='Given an array of integers and a target, return indices of two numbers such that they add up to target.'
      />
    </div>
  );
};

export default ProblemsPage;