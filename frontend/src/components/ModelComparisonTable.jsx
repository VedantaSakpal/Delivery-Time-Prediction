export default function ModelComparisonTable() {
  const models = [
    {
      model: 'Linear Regression',
      architecture: 'Linear additive model (OLS)',
      mae: '5.90',
      rmse: '8.83',
      r2: '0.826',
      cvRmse: '10.99 ± 1.04',
      isBest: true,
    },
    {
      model: 'Gradient Boosting',
      architecture: 'Sequential boosted trees',
      mae: '6.43',
      rmse: '9.27',
      r2: '0.808',
      cvRmse: '11.86 ± 1.16',
      isBest: false,
    },
    {
      model: 'Random Forest',
      architecture: 'Bagging, 200 trees',
      mae: '6.69',
      rmse: '9.59',
      r2: '0.795',
      cvRmse: '12.21 ± 1.00',
      isBest: false,
    },
    {
      model: 'XGBoost',
      architecture: 'Boosted trees, 200 est., depth 5',
      mae: '6.98',
      rmse: '9.97',
      r2: '0.778',
      cvRmse: '12.29 ± 1.06',
      isBest: false,
    },
    {
      model: 'Decision Tree',
      architecture: 'Single CART tree',
      mae: '10.90',
      rmse: '15.70',
      r2: '0.450',
      cvRmse: '17.19 ± 0.98',
      isBest: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Model Performance & Comparison</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
          Linear Regression (Selected)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#e8edf5] border-b border-slate-300 text-slate-900 font-bold text-sm">
              <th className="py-3 px-4 border border-slate-300">Model</th>
              <th className="py-3 px-4 border border-slate-300">Architecture</th>
              <th className="py-3 px-4 border border-slate-300 text-center">MAE</th>
              <th className="py-3 px-4 border border-slate-300 text-center">RMSE</th>
              <th className="py-3 px-4 border border-slate-300 text-center">R²</th>
              <th className="py-3 px-4 border border-slate-300 text-center">CV RMSE</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200">
            {models.map((item, idx) => (
              <tr
                key={idx}
                className={
                  item.isBest
                    ? 'bg-[#e2f0d9] font-bold text-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-800'
                }
              >
                <td className="py-3 px-4 border border-slate-300">{item.model}</td>
                <td className="py-3 px-4 border border-slate-300">{item.architecture}</td>
                <td className="py-3 px-4 border border-slate-300 text-center">{item.mae}</td>
                <td className="py-3 px-4 border border-slate-300 text-center">{item.rmse}</td>
                <td className="py-3 px-4 border border-slate-300 text-center">{item.r2}</td>
                <td className="py-3 px-4 border border-slate-300 text-center">{item.cvRmse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
