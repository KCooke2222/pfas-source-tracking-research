export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          About This Tool
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              What is this tool?
            </h2>
            <p>
              This is a PFAS (Per- and polyfluoroalkyl substances) source
              tracking tool that uses Non-metric Multidimensional Scaling (NMDS)
              analysis to visualize and determine source similarity in
              environmental samples.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              How it works
            </h2>
            <p>
              The tool analyzes PFAS concentration data from various sources and
              plots them on an NMDS ordination plot. Points that cluster
              together indicate similar PFAS signatures, suggesting similar
              contamination sources or processes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Source Types
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-800">BL</strong> — Biosolids
                  leachate
                  <p className="text-sm text-gray-600">
                    From biosolids-amended soils
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">GW</strong> — AFFF-impacted
                  groundwater
                  <p className="text-sm text-gray-600">
                    Groundwater affected by aqueous film-forming foam
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">LL</strong> — Landfill
                  leachate
                  <p className="text-sm text-gray-600">
                    Leachate from municipal landfills
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-800">PG</strong> —
                  Power-generation effluent
                  <p className="text-sm text-gray-600">
                    Wastewater from power plants
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">PP</strong> — Pulp & paper
                  mill effluent
                  <p className="text-sm text-gray-600">
                    Industrial wastewater from paper manufacturing
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">WWTP</strong> — Municipal
                  wastewater treatment plant effluent
                  <p className="text-sm text-gray-600">
                    Treated municipal wastewater discharge
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Using the tool
            </h2>
            <div className="space-y-2">
              <p>
                1. <strong>Upload your data:</strong> Provide a CSV file with
                PFAS concentration data
              </p>
              <p>
                2. <strong>View results:</strong> See your samples plotted on
                the NMDS ordination
              </p>
              <p>
                3. <strong>Interpret patterns:</strong> Samples that cluster
                near known source types may share similar contamination sources
              </p>
              <p>
                4. <strong>Download results:</strong> Export the NMDS
                coordinates for further analysis
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
