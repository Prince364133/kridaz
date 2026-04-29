 import  useOwners  from "@hooks/admin/useOwners";
import OwnerList from "./OwnerList";
import SearchBar from "./SearchBar";
import OwnersSkeleton from "./OwnersSkeleton";

const OwnerViewer = () => {
  const { owners, loading, searchTerm, handleSearch } = useOwners();

  if (loading) return <OwnersSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-20 bg-primary shadow-[0_0_15px_rgba(113,179,0,0.5)]"></div>
          <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none uppercase">
            Arena <span className="text-primary">Generals</span>
          </h1>
          <p className="font-mono text-gray-500 text-sm tracking-[0.4em] uppercase mt-4">Commanding Officers & Facility Owners</p>
        </div>

        <div className="space-y-8">
          <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <OwnerList owners={owners} />
        </div>
      </div>
    </div>
  );
};

export default OwnerViewer;
