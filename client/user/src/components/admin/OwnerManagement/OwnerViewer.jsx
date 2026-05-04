 import  useOwners  from "@hooks/admin/useOwners";
import OwnerList from "./OwnerList";
import SearchBar from "./SearchBar";
import OwnersSkeleton from "./OwnersSkeleton";

const OwnerViewer = () => {
  const { owners, loading, searchTerm, handleSearch } = useOwners();

  if (loading) return <OwnersSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-12">
        {/* Removed Header Section per user request */}

        <div className="space-y-8">
          <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <OwnerList owners={owners} />
        </div>
      </div>
    </div>
  );
};

export default OwnerViewer;
