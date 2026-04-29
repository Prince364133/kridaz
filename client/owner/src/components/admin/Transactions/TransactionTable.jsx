import React from "react";
import Avatar from "react-avatar";
import { ChevronUp, ChevronDown } from "lucide-react";

const TransactionTable = ({
  transactions,
  sortField,
  sortDirection,
  onSort,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5">
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">Operator</th>
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
              <button
                className="flex items-center group transition-colors hover:text-primary"
                onClick={() => onSort("createdAt")}
              >
                Timestamp
                {sortField === "createdAt" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-2 h-3 w-3 text-primary" />
                  ) : (
                    <ChevronDown className="ml-2 h-3 w-3 text-primary" />
                  ))}
              </button>
            </th>
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">Arena</th>
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">Deployment ID</th>
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">Auth ID</th>
            <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 text-right">
              <button
                className="flex items-center justify-end w-full group transition-colors hover:text-primary"
                onClick={() => onSort("totalPrice")}
              >
                Value
                {sortField === "totalPrice" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-2 h-3 w-3 text-primary" />
                  ) : (
                    <ChevronDown className="ml-2 h-3 w-3 text-primary" />
                  ))}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((transaction) => (
            <tr key={transaction._id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-1 notched-corner bg-white/5 group-hover:bg-primary/20 transition-colors">
                     <Avatar name={transaction.user.name} size="32" className="notched-corner" />
                  </div>
                  <span className="font-display font-black italic uppercase text-xs tracking-tight">{transaction.user.name}</span>
                </div>
              </td>
              <td className="p-4 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </td>
              <td className="p-4">
                 <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{transaction.turf.name}</span>
              </td>
              <td className="p-4 font-mono text-[10px] uppercase text-gray-500 tracking-tighter truncate max-w-[120px]">
                {transaction.payment.orderId}
              </td>
              <td className="p-4 font-mono text-[10px] uppercase text-gray-500 tracking-tighter truncate max-w-[120px]">
                {transaction.payment.paymentId}
              </td>
              <td className="p-4 text-right">
                 <span className="font-display font-black italic text-sm text-primary tracking-tight">₹{transaction.totalPrice}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
