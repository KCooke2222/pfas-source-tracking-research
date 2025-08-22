import serdpLogo from "../assets/serdp_logo.svg";
import osuLogo from "../assets/OSU.png";
import cornellLogo from "../assets/Cornell.png";
import minesLogo from "../assets/CSM.png";

export default function Home({ setCurrentPage }) {
  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl md:text-4xl max-w-3xl mx-auto leading-relaxed">
              Upload PFAS data and compare with source profiles using NMDS
              analysis
            </h1>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentPage("1633_pfas")}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium text-white bg-primary-800 hover:bg-primary-900 transition-colors"
              >
                1633 PFAS Analysis
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage("diagnostic_chemicals")}
                className="inline-flex items-center px-6 py-3 border border-primary-800 text-base font-medium text-primary-800 bg-white hover:bg-primary-50 transition-colors"
              >
                Diagnostic Chemicals Analysis
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
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
              <div className="mt-4 text-lg text-primary-600 leading-relaxed space-y-3">
                <p>
                  This tool generates NMDS ordinations using three analytical
                  approaches: <strong>1633 PFAS compounds</strong>, or{" "}
                  <strong>diagnostic target and suspect chemicals</strong>.
                </p>
                <p>
                  When samples cluster together on the plot, they share similar
                  chemical signatures that may indicate common contamination
                  sources.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      1
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">
                      Upload your data
                    </h3>
                    <p className="mt-1 text-primary-600">
                      Provide a CSV file with PFAS concentration data
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">
                      View results
                    </h3>
                    <p className="mt-1 text-primary-600">
                      See your samples plotted on the NMDS ordination
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-primary-800 text-white">
                      3
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-900">
                      Interpret patterns
                    </h3>
                    <p className="mt-1 text-primary-600">
                      Samples that cluster near known source types may share
                      similar contamination sources
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Types */}
            <div className="mt-10 lg:mt-0">
              <h3 className="text-2xl font-bold text-primary-900 mb-6">
                Source Types
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    BL — Biosolids leachate
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    From biosolids-amended soils
                  </p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    GW — AFFF-impacted groundwater
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Groundwater affected by aqueous film-forming foam
                  </p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    LL — Landfill leachate
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Leachate from municipal landfills
                  </p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    PG — Power-generation effluent
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Wastewater from power plants
                  </p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    PP — Pulp & paper mill effluent
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Industrial wastewater from paper manufacturing
                  </p>
                </div>
                <div className="bg-white p-4 border border-primary-200">
                  <h4 className="font-semibold text-primary-900">
                    WWTP — Municipal wastewater treatment plant effluent
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Treated municipal wastewater discharge
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-12 bg-primary-50 border-t border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-primary-900 mb-4">
              Contact Information
            </h3>
            <p className="text-primary-600 mb-2 text-base">
              For questions about this tool or collaboration opportunities:
            </p>
            <div className="text-primary-800 font-medium text-base">
              <p>Gerrad Jones</p>
              <p>gerrad.jones@oregonstate.edu</p>
              <p>Office: 541-737-4534</p>
            </div>
          </div>
        </div>
      </div>

      {/* SERDP and University Collaboration Section */}
      <div className="py-12 bg-white border-t border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* SERDP Funding */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Funding Support
              </h3>
              <p className="text-primary-600 mb-6">
                This project is supported by funding from SERDP (Strategic
                Environmental Research and Development Program), which advances
                innovative solutions for Department of Defense environmental
                challenges, including PFAS contamination.
              </p>
              <div className="flex justify-center">
                <img
                  src={serdpLogo}
                  alt="SERDP Logo"
                  className="h-16 w-auto serdp-logo"
                />
              </div>
            </div>

            {/* University Collaboration */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Research Collaboration
              </h3>
              <p className="text-primary-600 mb-6">
                A joint effort between Oregon State University, Cornell
                University, and Colorado School of Mines.
              </p>
              <div className="flex justify-center items-center space-x-12">
                <img
                  src={osuLogo}
                  alt="Oregon State University"
                  className="h-24 w-auto"
                />
                <img
                  src={cornellLogo}
                  alt="Cornell University"
                  className="h-24 w-auto"
                />
                <img
                  src={minesLogo}
                  alt="Colorado School of Mines"
                  className="h-24 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
