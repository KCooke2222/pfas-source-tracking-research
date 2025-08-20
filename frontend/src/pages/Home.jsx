import serdpLogo from "../assets/serdp_logo.svg";

export default function Home({ setCurrentPage }) {
  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-900 sm:text-5xl md:text-6xl">
              PFAS Source Tracking
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-600">
              Analyze PFAS contamination data using Non-metric Multidimensional Scaling (NMDS) 
              to identify source similarities in environmental samples.
            </p>
            <div className="mt-10">
              <button
                onClick={() => setCurrentPage("inference")}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium text-white bg-primary-800 hover:bg-primary-900 transition-colors"
              >
                Start Analysis
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-primary-600">
                The tool analyzes PFAS concentration data from various sources and plots them 
                on an NMDS ordination plot. Points that cluster together indicate similar 
                PFAS signatures, suggesting similar contamination sources or processes.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      1
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">Upload your data</h3>
                    <p className="mt-1 text-primary-600">Provide a CSV file with PFAS concentration data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">View results</h3>
                    <p className="mt-1 text-primary-600">See your samples plotted on the NMDS ordination</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      3
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">Interpret patterns</h3>
                    <p className="mt-1 text-primary-600">Samples that cluster near known source types may share similar contamination sources</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Types */}
            <div className="mt-10 lg:mt-0">
              <h3 className="text-2xl font-bold text-primary-900 mb-6">Source Types</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">BL — Biosolids leachate</h4>
                  <p className="text-sm text-primary-600 mt-1">From biosolids-amended soils</p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">GW — AFFF-impacted groundwater</h4>
                  <p className="text-sm text-primary-600 mt-1">Groundwater affected by aqueous film-forming foam</p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">LL — Landfill leachate</h4>
                  <p className="text-sm text-primary-600 mt-1">Leachate from municipal landfills</p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">PG — Power-generation effluent</h4>
                  <p className="text-sm text-primary-600 mt-1">Wastewater from power plants</p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">PP — Pulp & paper mill effluent</h4>
                  <p className="text-sm text-primary-600 mt-1">Industrial wastewater from paper manufacturing</p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">WWTP — Municipal wastewater treatment plant effluent</h4>
                  <p className="text-sm text-primary-600 mt-1">Treated municipal wastewater discharge</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Acknowledgment Section */}
      <div className="py-12 bg-white border-t border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Funding Support</h3>
            <p className="text-primary-600 max-w-3xl mx-auto">
              This project is supported by funding from SERDP (Strategic Environmental Research and Development Program), 
              which advances innovative solutions for Department of Defense environmental challenges, including PFAS contamination.
            </p>
            <div className="mt-6">
              <div className="flex justify-center items-center">
                <img 
                  src={serdpLogo} 
                  alt="SERDP Logo" 
                  className="h-16 w-auto serdp-logo"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}