import useTransactionData from "@hooks/admin/useTransactionData";
import TransactionSkeleton from "./TransactionSkeleton";
import TransactionFilters from "./TransactionFilters";
import TransactionTable from "./TransactionTable";
import useTransactionManagement from "@hooks/admin/useTransactionManagement.jsx";

const TransactionSection = () => {
  const { transactions, loading, error } = useTransactionData();

  const {
    filters,
    sortField,
    sortDirection,
    filteredAndSortedTransactions,
    handleFilterChange,
    toggleSort,
  } = useTransactionManagement(transactions);

  if (loading) return <TransactionSkeleton />;
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10">
      <div className="bg-red-500/10 border border-red-500/20 notched-corner p-8 text-center">
        <p className="font-display font-black italic text-xl text-red-500 uppercase tracking-widest">Nexus Error Detected</p>
        <p className="font-mono text-xs text-red-400 mt-2">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-20 bg-primary shadow-[0_0_15px_rgba(113,179,0,0.5)]"></div>
          <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none uppercase">
            Financial <span className="text-primary">Nexus</span>
          </h1>
          <p className="font-mono text-gray-500 text-sm tracking-[0.4em] uppercase mt-4">Universal Transaction Ledger & Revenue Flow</p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111111] notched-corner border border-white/5 p-8">
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          <div className="bg-[#111111] notched-corner border border-white/5 overflow-hidden">
            <TransactionTable
              transactions={filteredAndSortedTransactions}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSection;
