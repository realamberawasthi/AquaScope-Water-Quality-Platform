import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { getPublicSummary, getChartData, predictRisk, getCountryDetails } from '../services/api';
import { Activity, Droplets, Map as MapIcon, ShieldAlert, TrendingUp, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
                <p className={`text-xs mt-1 ${subtext.includes('+') ? 'text-green-600' : 'text-gray-400'}`}>
                    {subtext}
                </p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
);

const CountryInsightModal = ({ country, onClose }) => {
    if (!country) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 flex justify-between items-start text-white">
                    <div>
                        <h2 className="text-2xl font-bold">{country.country}</h2>
                        <p className="text-blue-100 text-sm">Water Quality Profile</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Risk Level</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${country.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                            country.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                            }`}>{country.risk_level}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-400">Avg Risk Score</p>
                            <p className="text-lg font-bold text-gray-800">{country.avg_risk_score.toFixed(2)}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-400">Total Disease Cases</p>
                            <p className="text-lg font-bold text-gray-800">{country.total_disease_cases}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-400">Avg Bacteria (CFU)</p>
                            <p className="text-lg font-bold text-gray-800">{country.avg_bacteria.toFixed(0)}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-xs text-gray-400">Clean Water Access</p>
                            <p className="text-lg font-bold text-gray-800">{country.avg_access.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Primary Water Source</p>
                        <p className="font-semibold text-blue-600 flex items-center">
                            <Droplets className="w-4 h-4 mr-2" /> {country.top_water_source}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const RiskPredictor = () => {
    const [inputs, setInputs] = useState({
        region: 'North',
        country: 'Country A',
        water_source: 'Well',
        treatment_method: 'None',
        bacteria_count: 100,
        turbidity: 5,
        access_to_clean_water: 50,
        contaminant_level: 10
    });
    const [result, setResult] = useState(null);

    const handlePredict = async () => {
        try {
            const data = await predictRisk(inputs);
            setResult(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Live Risk Predictor (ML Model)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <label className="block text-gray-500 mb-1">Bacteria Count</label>
                    <input
                        type="number" className="w-full border rounded p-2"
                        value={inputs.bacteria_count}
                        onChange={e => setInputs({ ...inputs, bacteria_count: parseFloat(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-1">Turbidity (NTU)</label>
                    <input
                        type="number" className="w-full border rounded p-2"
                        value={inputs.turbidity}
                        onChange={e => setInputs({ ...inputs, turbidity: parseFloat(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-1">Access to Water (%)</label>
                    <input
                        type="number" className="w-full border rounded p-2"
                        value={inputs.access_to_clean_water}
                        onChange={e => setInputs({ ...inputs, access_to_clean_water: parseFloat(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-1">Treatment</label>
                    <select
                        className="w-full border rounded p-2"
                        value={inputs.treatment_method}
                        onChange={e => setInputs({ ...inputs, treatment_method: e.target.value })}
                    >
                        <option>None</option>
                        <option>Chlorination</option>
                        <option>Boiling</option>
                        <option>Filtration</option>
                    </select>
                </div>
            </div>
            <button
                onClick={handlePredict}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
                Predict Risk
            </button>

            {result && (
                <div className={`mt-4 p-4 rounded-lg bg-gray-50 border ${result.risk_level === 'High' ? 'border-red-200' : 'border-green-200'}`}>
                    <p className="text-sm text-gray-500">Predicted Risk Score</p>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{result.risk_score.toFixed(2)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                            result.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                            {result.risk_level} Risk
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

const MemoizedChart = React.memo(({ option, style }) => (
    <ReactECharts option={option} style={style} />
));

const CountryProfileCard = ({ country, onClear }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white mb-8 relative"
    >
        <button
            onClick={onClear}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            title="Clear Search"
        >
            <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{country.country}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/30`}>
                        {country.risk_level} Risk
                    </span>
                </div>
                <p className="text-blue-100 flex items-center">
                    <Droplets className="w-4 h-4 mr-2" />
                    Primary Source: <span className="font-semibold ml-1">{country.top_water_source}</span>
                </p>
            </div>

            <div className="flex gap-8 text-center">
                <div>
                    <p className="text-blue-200 text-sm mb-1">Risk Score</p>
                    <p className="text-3xl font-bold">{country.avg_risk_score.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-blue-200 text-sm mb-1">Disease Cases</p>
                    <p className="text-3xl font-bold">{country.total_disease_cases}</p>
                </div>
                <div>
                    <p className="text-blue-200 text-sm mb-1">Clean Access</p>
                    <p className="text-3xl font-bold">{country.avg_access.toFixed(0)}%</p>
                </div>
            </div>
        </div>
    </motion.div>
);

const PublicDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedCountry, setSearchedCountry] = useState(null);
    const [viewMode, setViewMode] = useState('Global'); // Global or Country

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (country = null) => {
        const [sumData, chartData] = await Promise.all([
            getPublicSummary(),
            getChartData(country)
        ]);
        setSummary(sumData);
        setCharts(chartData);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        try {
            // 1. Get Details
            const details = await getCountryDetails(searchTerm.trim());
            setSearchedCountry(details);

            // 2. Refresh Charts for Country
            await loadData(searchTerm.trim());
            setViewMode('Country');

        } catch (error) {
            alert('Country not found in dataset');
        }
    };

    const clearSearch = async () => {
        setSearchedCountry(null);
        setSearchTerm('');
        setViewMode('Global');
        await loadData(null);
    };

    if (!summary || !charts) return <div className="p-10 text-center">Loading Analytics...</div>;

    // Build heatmap: Y-axis = Regions, X-axis = Parameters
    const heatmapParams = charts.heatmap_params || [
        "Contaminant Level (ppm)",
        "pH Level",
        "Turbidity (NTU)",
        "Nitrate Level (mg/L)",
        "Lead Concentration (µg/L)",
        "Bacteria Count (CFU/mL)"
    ];

    // Short labels for X-axis
    const paramLabels = {
        "Contaminant Level (ppm)": "Contaminants",
        "pH Level": "pH",
        "Turbidity (NTU)": "Turbidity",
        "Nitrate Level (mg/L)": "Nitrate",
        "Lead Concentration (µg/L)": "Lead",
        "Bacteria Count (CFU/mL)": "Bacteria"
    };

    const regions = charts.heatmap.map(i => i.Region);

    // Normalize scales for each parameter to 0-100 for color intensity
    const normalizers = {
        "Contaminant Level (ppm)": 100,
        "pH Level": 14,
        "Turbidity (NTU)": 10,
        "Nitrate Level (mg/L)": 50,
        "Lead Concentration (µg/L)": 50,
        "Bacteria Count (CFU/mL)": 500
    };

    const heatmapData = [];
    charts.heatmap.forEach((item, yIndex) => {
        heatmapParams.forEach((param, xIndex) => {
            const rawValue = item[param] || 0;
            const normalizedValue = Math.min((rawValue / (normalizers[param] || 100)) * 100, 100);
            heatmapData.push([xIndex, yIndex, normalizedValue.toFixed(1)]);
        });
    });

    const heatmapOption = {
        title: { text: `Water Quality Heatmap - ${charts.title_context || 'Global'}`, left: 'center' },
        tooltip: {
            position: 'top',
            formatter: (params) => {
                const paramName = heatmapParams[params.data[0]];
                const region = regions[params.data[1]];
                const value = charts.heatmap[params.data[1]][paramName];
                return `<b>${region}</b><br/>${paramName}: ${value?.toFixed(2) || 'N/A'}`;
            }
        },
        grid: { height: '60%', top: '10%', left: '15%' },
        xAxis: {
            type: 'category',
            data: heatmapParams.map(p => paramLabels[p] || p),
            splitArea: { show: true },
            axisLabel: { rotate: 30, fontSize: 10 }
        },
        yAxis: {
            type: 'category',
            data: regions,
            splitArea: { show: true }
        },
        visualMap: {
            min: 0,
            max: 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            inRange: {
                color: ['#22c55e', '#eab308', '#ef4444'] // Green to Yellow to Red
            }
        },
        series: [{
            name: 'Severity',
            type: 'heatmap',
            data: heatmapData,
            label: { show: false },
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
            }
        }]
    };

    const barOption = {
        title: { text: viewMode === 'Country' ? 'Disease Cases by Source' : 'Disease Cases by Region', left: 'center' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 'bottom' },
        xAxis: { type: 'category', data: charts.disease_bar.map(i => i.Region) },
        yAxis: { type: 'value' },
        series: [
            { name: 'Cholera', type: 'bar', stack: 'total', data: charts.disease_bar.map(i => i["Cholera Cases"]) },
            { name: 'Typhoid', type: 'bar', stack: 'total', data: charts.disease_bar.map(i => i["Typhoid Cases"]) },
            { name: 'Diarrhea', type: 'bar', stack: 'total', data: charts.disease_bar.map(i => i["Diarrheal Cases"]) }
        ]
    };

    // Boxplot for Treatment Method Effectiveness
    const boxplotOption = charts.boxplot && charts.boxplot.length > 0 ? {
        title: { text: 'Treatment Method Effectiveness', left: 'center' },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                if (params.componentType === 'series') {
                    const bp = charts.boxplot[params.dataIndex];
                    return `<b>${bp.method}</b><br/>
                        Min: ${bp.min.toFixed(0)}<br/>
                        Q1: ${bp.q1.toFixed(0)}<br/>
                        Median: ${bp.median.toFixed(0)}<br/>
                        Q3: ${bp.q3.toFixed(0)}<br/>
                        Max: ${bp.max.toFixed(0)}<br/>
                        Samples: ${bp.count}`;
                }
                return '';
            }
        },
        grid: { left: '10%', right: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: charts.boxplot.map(b => b.method),
            axisLabel: { fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            name: 'Bacteria Count (CFU/mL)',
            nameLocation: 'middle',
            nameGap: 50
        },
        series: [{
            name: 'Bacteria Count',
            type: 'boxplot',
            data: charts.boxplot.map(b => [b.min, b.q1, b.median, b.q3, b.max]),
            itemStyle: {
                color: '#3b82f6',
                borderColor: '#1e40af'
            }
        }]
    } : null;

    // Rainfall vs Turbidity Scatter
    const rainfallOption = charts.rainfall_turbidity && charts.rainfall_turbidity.length > 0 ? {
        title: { text: 'Environmental Impact: Rainfall vs Turbidity', left: 'center' },
        tooltip: {
            trigger: 'item',
            formatter: (params) => `<b>${params.data[2]}</b><br/>Rainfall: ${params.data[0]}mm<br/>Turbidity: ${params.data[1]} NTU`
        },
        xAxis: {
            type: 'value',
            name: 'Rainfall (mm)',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'value',
            name: 'Turbidity (NTU)',
            nameLocation: 'middle',
            nameGap: 40
        },
        series: [{
            type: 'scatter',
            symbolSize: 8,
            data: charts.rainfall_turbidity.map(d => [d.rainfall, d.turbidity, d.region]),
            itemStyle: { color: '#06b6d4' }
        }]
    } : null;

    // Development Paradox Quadrant
    const developmentQuadrantOption = charts.development_quadrant && charts.development_quadrant.length > 0 ? {
        title: { text: 'Development Paradox: GDP vs Healthcare Access', left: 'center' },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                const d = charts.development_quadrant[params.dataIndex];
                return `<b>${d.country}</b><br/>
                    GDP: $${d.gdp.toFixed(0)}<br/>
                    Healthcare: ${d.healthcare.toFixed(1)}<br/>
                    Urbanization: ${d.urbanization.toFixed(1)}%<br/>
                    Risk: ${d.risk_level}`;
            }
        },
        grid: { left: '12%', right: '5%', bottom: '12%', top: '15%' },
        xAxis: {
            type: 'value',
            name: 'GDP per Capita ($)',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'value',
            name: 'Healthcare Access Index',
            nameLocation: 'middle',
            nameGap: 45
        },
        series: [
            {
                type: 'scatter',
                symbolSize: (val, params) => {
                    const d = charts.development_quadrant[params.dataIndex];
                    return Math.max(10, d.urbanization / 3);
                },
                data: charts.development_quadrant.map(d => [d.gdp, d.healthcare]),
                itemStyle: {
                    color: (params) => {
                        const d = charts.development_quadrant[params.dataIndex];
                        return d.risk_level === 'High' ? '#ef4444' : (d.risk_level === 'Medium' ? '#f59e0b' : '#22c55e');
                    }
                }
            },
            // Reference lines
            {
                type: 'line',
                markLine: {
                    silent: true,
                    lineStyle: { color: '#9ca3af', type: 'dashed' },
                    data: [
                        { xAxis: charts.development_refs?.gdp_mean || 0, name: 'Avg GDP' },
                        { yAxis: charts.development_refs?.healthcare_mean || 0, name: 'Avg Healthcare' }
                    ]
                }
            }
        ]
    } : null;

    // Socioeconomic Vulnerability Heatmap
    const socioParams = charts.socio_cols || [];
    const socioLabels = {
        "Healthcare Access Index": "Healthcare",
        "Urbanization Rate": "Urban%",
        "Infant Mortality Rate": "Infant Mort.",
        "Risk Score": "Risk"
    };
    const socioCountries = charts.socio_heatmap?.map(r => r.Country) || [];

    const socioNormalizers = {
        "Healthcare Access Index": 100,    // 0-100 scale
        "Urbanization Rate": 100,          // 0-100%
        "Infant Mortality Rate": 100,      // Per 1000, max ~100
        "Risk Score": 1                     // 0-1 scale
    };

    // Indicators where HIGHER raw value = BETTER outcome (invert so high = green/low vulnerability)
    // Healthcare: Higher = better access → invert
    // Infant Mortality: LOWER = better → also invert (so higher IMR shows as red)
    // Wait - for IMR, higher = worse, so we DON'T invert. The raw normalization already makes high = red.
    // We only invert metrics where high = good, so they become low (green) on the vulnerability scale.
    const invertedIndicators = ["Healthcare Access Index"];

    // For Infant Mortality: Higher = worse → normalize directly (no inversion needed, high = red = correct)
    // For Urbanization: Neutral → no inversion (just show as-is)
    // For Risk Score: Higher = worse → no inversion needed

    const socioData = [];
    charts.socio_heatmap?.forEach((item, yIndex) => {
        socioParams.forEach((param, xIndex) => {
            const rawValue = item[param] || 0;
            let normalized = Math.min((rawValue / (socioNormalizers[param] || 100)) * 100, 100);

            // Invert for positive indicators (higher = better = should show as GREEN/low vulnerability)
            if (invertedIndicators.includes(param)) {
                normalized = 100 - normalized;
            }

            socioData.push([xIndex, yIndex, normalized.toFixed(1)]);
        });
    });

    const socioHeatmapOption = charts.socio_heatmap && charts.socio_heatmap.length > 0 ? {
        title: { text: 'Socioeconomic Vulnerability Matrix', left: 'center' },
        tooltip: {
            formatter: (params) => {
                const param = socioParams[params.data[0]];
                const country = socioCountries[params.data[1]];
                const value = charts.socio_heatmap[params.data[1]][param];
                return `<b>${country}</b><br/>${param}: ${value?.toFixed(2) || 'N/A'}`;
            }
        },
        grid: { height: '60%', top: '10%', left: '20%' },
        xAxis: {
            type: 'category',
            data: socioParams.map(p => socioLabels[p] || p),
            splitArea: { show: true },
            axisLabel: { rotate: 30, fontSize: 10 }
        },
        yAxis: {
            type: 'category',
            data: socioCountries,
            splitArea: { show: true }
        },
        visualMap: {
            min: 0,
            max: 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            inRange: { color: ['#22c55e', '#eab308', '#ef4444'] }
        },
        series: [{
            type: 'heatmap',
            data: socioData,
            label: { show: false },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    } : null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {/* Header Section */}
            <div className="text-center py-8 relative">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Global Water Quality Monitor</h1>
                <p className="mt-4 text-lg text-gray-600">AI-driven insights into public health risks and water safety.</p>

                {/* Search Bar */}
                {!searchedCountry && (
                    <div className="mt-6 max-w-md mx-auto">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search by Country (e.g., 'Country A')..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            <button type="submit" className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700">
                                Search
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Country Profile Card */}
            {searchedCountry && (
                <CountryProfileCard country={searchedCountry} onClear={clearSearch} />
            )}

            {/* Stats Grid - Hide in Country Mode or keep? Keep for context. */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${searchedCountry ? 'opacity-70 grayscale-[50%]' : ''}`}>
                <StatCard
                    title="Avg Risk Score"
                    value={summary.avg_risk_score.toFixed(2)}
                    subtext="Global Average"
                    icon={ShieldAlert}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Regions Monitored"
                    value={summary.total_regions}
                    subtext="Active Sensors"
                    icon={MapIcon}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="High Risk Areas"
                    value={`${summary.high_risk_percentage.toFixed(1)}%`}
                    subtext="Require Action"
                    icon={TrendingUp}
                    color="bg-red-500"
                />
                <StatCard
                    title="Model Accuracy"
                    value={`${(summary.recent_training_accuracy * 100).toFixed(0)}%`}
                    subtext="Random Forest"
                    icon={Activity}
                    color="bg-green-500"
                />
            </div>

            {/* Main Viz Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <MemoizedChart option={heatmapOption} style={{ height: '400px' }} />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-base font-semibold text-gray-900">
                            {viewMode === 'Country' ? 'Source Analysis' : 'Understanding the Heatmap'}
                        </h4>
                        <p className="text-base text-gray-500 mt-2">
                            {viewMode === 'Country'
                                ? "This heatmap breaks down contamination levels by water source type (e.g., Well, River) within the selected country. Compare how different sources perform across parameters to identify which infrastructure needs priority upgrades."
                                : "This Regional × Parameter heatmap displays average water quality metrics per region. Each cell shows contamination intensity from Green (safe) to Red (critical). Use this to identify which regions have the most severe contamination and which specific pollutants are problematic."}
                        </p>
                        <p className="text-sm text-gray-400 mt-3">
                            <strong>How to read:</strong> Rows = Regions, Columns = Water quality parameters. Darker red = higher risk. Hover for exact values.
                        </p>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <RiskPredictor />
                </div>
            </div>

            {/* Disease Bar Chart */}
            <div className="pb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <MemoizedChart option={barOption} style={{ height: '350px' }} />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-base font-semibold text-gray-900">Disease Correlation</h4>
                        <p className="text-base text-gray-500 mt-2">
                            This stacked bar chart displays the total reported cases of <strong>Cholera</strong>, <strong>Typhoid</strong>, and <strong>Diarrhea</strong> per region.
                            Regions with taller bars have higher disease burdens, often correlating with poor water quality.
                        </p>
                        <p className="text-sm text-gray-400 mt-3">
                            <strong>Policy insight:</strong> Target regions with high case counts for water treatment infrastructure investment and public health campaigns.
                        </p>
                    </div>
                </div>
            </div>

            {/* Treatment Method Effectiveness Boxplot */}
            {boxplotOption && (
                <div className="pb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <MemoizedChart option={boxplotOption} style={{ height: '400px' }} />
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-base font-semibold text-gray-900">Treatment Method Effectiveness</h4>
                            <p className="text-base text-gray-500 mt-2">
                                This boxplot compares <strong>Bacteria Count (CFU/mL)</strong> across water treatment methods: Boiling, Filtration, Chlorination, and None.
                                Each box shows the interquartile range (Q1-Q3), the line inside is the median, and whiskers extend to min/max values.
                            </p>
                            <p className="text-sm text-gray-400 mt-3">
                                <strong>How to interpret:</strong> <span className="text-green-600">Lower median = more effective treatment</span>. Narrow boxes indicate consistent performance. "None" typically shows highest bacteria levels, validating treatment necessity.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                <strong>Policy relevance:</strong> Use this to recommend cost-effective treatment methods based on regional resources.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Environmental Impact: Rainfall vs Turbidity */}
            {rainfallOption && (
                <div className="pb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <MemoizedChart option={rainfallOption} style={{ height: '400px' }} />
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-base font-semibold text-gray-900">Environmental Impact Analysis</h4>
                            <p className="text-base text-gray-500 mt-2">
                                This scatter plot reveals the relationship between <strong>Rainfall (mm)</strong> and <strong>Turbidity (NTU)</strong>.
                                Higher rainfall increases surface runoff, carrying sediments and pollutants into water sources, which raises turbidity levels.
                            </p>
                            <p className="text-sm text-gray-400 mt-3">
                                <strong>Environmental insight:</strong> Upward trends indicate climate-driven contamination risks. Regions with steep correlations should prepare for water quality degradation during monsoon seasons.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                <strong>Action:</strong> Deploy preemptive filtration or advisories before forecasted heavy rainfall.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Socioeconomic Vulnerability Matrix - MOVED UP */}
            {socioHeatmapOption && (
                <div className="pb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <MemoizedChart option={socioHeatmapOption} style={{ height: '450px' }} />
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-base font-semibold text-gray-900">Socioeconomic Vulnerability Matrix</h4>
                            <p className="text-base text-gray-500 mt-2">
                                This comprehensive heatmap summarizes <strong>all socioeconomic vulnerability indicators</strong> in one view.
                                Rows represent countries/regions; columns show: Healthcare Access, Urbanization, Infant Mortality, and Water Risk Score.
                                Use this matrix to quickly identify which countries face multiple compounding vulnerabilities.
                            </p>
                            <p className="text-sm text-gray-400 mt-3">
                                <strong>Color scale:</strong> <span className="text-green-600">Green = Low vulnerability</span> → <span className="text-amber-500">Yellow = Moderate</span> → <span className="text-red-500">Red = High vulnerability</span>.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                <strong>Policy use:</strong> Identify countries with multiple red cells for priority intervention. Compare rows to find "efficient" countries (limited resources but good outcomes) as models for policy learning.
                            </p>
                            <p className="text-sm italic text-gray-500 mt-3">
                                "This matrix helps policymakers identify where investment yields the highest health impact."
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Development Paradox Quadrant - MOVED DOWN */}
            {developmentQuadrantOption && (
                <div className="pb-12">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <MemoizedChart option={developmentQuadrantOption} style={{ height: '450px' }} />
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-base font-semibold text-gray-900">Development Paradox Quadrant</h4>
                            <p className="text-base text-gray-500 mt-2">
                                This quadrant analysis plots <strong>GDP per Capita</strong> vs <strong>Healthcare Access Index</strong> for each country.
                                Dashed reference lines divide the chart into 4 quadrants that reveal governance patterns and policy effectiveness:
                            </p>
                            <ul className="text-sm text-gray-400 mt-3 space-y-2 list-disc list-inside">
                                <li><span className="text-green-600 font-medium">High GDP + High Healthcare</span> → Resilient systems (model regions with resources and outcomes aligned)</li>
                                <li><span className="text-red-500 font-medium">High GDP + Low Healthcare</span> → Policy failure (wealth exists but not reaching health sector)</li>
                                <li><span className="text-amber-500 font-medium">Low GDP + High Healthcare</span> → Efficient systems (doing more with less, models for learning)</li>
                                <li><span className="text-gray-600 font-medium">Low GDP + Low Healthcare</span> → Critical risk zones (priority intervention needed)</li>
                            </ul>
                            <p className="text-sm text-gray-400 mt-3">
                                <strong>Visual encoding:</strong> Dot color = Water Risk Level (Green = Low, Yellow = Medium, Red = High). Dot size = Urbanization Rate (larger = more urbanized).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicDashboard;
