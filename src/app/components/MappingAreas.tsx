import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from 'react-leaflet';
import type { CircleMarker as LeafletCircleMarker } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatPHDateShort } from '../../utils/dateHelpers';
import { apiUrl } from '@/utils/apiBase';
import jsPDF from 'jspdf';
import { HeatmapLayer, type HeatmapData } from './HeatmapLayer';


interface PlantingArea {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  species: string;
  plantedDate: string;
  totalPlants: number;
  healthStatus: 'healthy' | 'monitoring' | 'critical';
  description: string;
}

interface MonitoringRecord {
  id: number;
  site_name: string;
  barangay: string;
  latitude: string;
  longitude: string;
  species: string;
  date_planted: string;
  planting_method: string;
  number_seedlings: number;
  monitoring_date: string;
  condition_status: string;
  current_height_cm: number | null;
  survival_status: string;
  remarks: string;
  photo_path: string | null;
  status: string;
  created_at?: string;
  growing_count: number | null;
  at_risk_count: number | null;
  dead_count: number | null;
}

interface ResearchStudy {
  id: string;
  title: string;
  description: string;
  fullContent: string;
  authors: string[];
  publishedDate: string;
  icon: 'document' | 'flask' | 'balance' | 'globe' | 'book' | 'chart';
}

type ReportType =
  | 'Monitoring Summary'
  | 'Species Distribution'
  | 'Survival Rate'
  | 'Conservation Overview';

type ReportFilter = ReportType | 'All Reports';

type ReportFormat = 'pdf' | 'csv';

interface GeneratedReport {
  id: string;
  title: string;
  description: string;
  format: ReportFormat;
  generatedAt: string;
  dateRange: string;
  filename: string;
  downloadUrl: string;
}





const tileProviders = [
  {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'] as const,
  },
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer">Esri</a>',
  },
  {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'] as const,
  },
  {
    url: apiUrl('/api/map-tiles.php?z={z}&x={x}&y={y}&provider=osm'),
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    url: apiUrl('/api/map-tiles.php?z={z}&x={x}&y={y}&provider=carto'),
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    url: apiUrl('/api/map-tiles.php?z={z}&x={x}&y={y}&provider=esri'),
    attribution: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer">Esri</a>',
  },
];

const researchStudies: ResearchStudy[] = [
  {
    id: 'R-1',
    title: 'Growth Rate Study',
    description: 'Comprehensive analysis of mangrove growth patterns across different seasons',
    fullContent: 'This comprehensive study examines the seasonal growth patterns of Rhizophora apiculata and Avicennia marina species in the Panabo City mangrove reserve. Our findings show that growth rates are highest during the monsoon season with an average increase of 0.85m per year. The study tracked 15 different planting sites over 24 months and identified optimal conditions for maximum biomass accumulation. Key findings include temperature sensitivity, salinity tolerance ranges, and recommendations for planting schedules that maximize growth potential.',
    authors: ['Dr. Maria Santos', 'Dr. Juan Dela Cruz', 'Dr. Angela Rodriguez'],
    publishedDate: 'Mar 2026',
    icon: 'document'
  },
  {
    id: 'R-2',
    title: 'Species Diversity Analysis',
    description: 'Biodiversity assessment and species interaction studies',
    fullContent: 'A detailed biodiversity assessment of the Panabo mangrove ecosystem documenting the presence of 6 major mangrove species and 24 associated plant species. This study analyzes species interactions, spatial distribution patterns, and ecological relationships. We identified symbiotic relationships between mangrove species and associated fauna including fish, crustaceans, and birds. The research demonstrates that diverse mangrove communities provide superior ecosystem services compared to monoculture plantings.',
    authors: ['Dr. Carlos Mercado', 'Dr. Rosa Luna', 'Dr. Miguel Torres'],
    publishedDate: 'Feb 2026',
    icon: 'flask'
  },
  {
    id: 'R-3',
    title: 'Water Quality Impact',
    description: 'Effects of water quality on mangrove health and survival rates',
    fullContent: 'This study investigates the relationship between water quality parameters (salinity, pH, dissolved oxygen, nutrient levels) and mangrove health outcomes. We conducted monthly water sampling across 12 monitoring stations for 18 months. Results show that optimal salinity levels (15-30 ppt) significantly improve survival rates in newly planted areas. Water quality monitoring provides early warning indicators for environmental stress that could affect mangrove productivity.',
    authors: ['Dr. Patricia Gonzales', 'Dr. Luis Manuel', 'Dr. Sophia Cruz'],
    publishedDate: 'Jan 2026',
    icon: 'balance'
  },
  {
    id: 'R-4',
    title: 'Carbon Sequestration Study',
    description: 'Measuring carbon capture efficiency of different mangrove species',
    fullContent: 'A comprehensive carbon accounting study quantifying the CO2 sequestration capacity of different mangrove species. Rhizophora species demonstrated the highest carbon storage capacity at 18.2 tons CO2/hectare/year, followed by Bruguiera at 15.7 tons/hectare/year. This research provides crucial data for carbon credit programs and climate change mitigation initiatives. The study also estimates that Panabo\'s mangrove reserve currently sequesters approximately 892 tons of CO2 annually.',
    authors: ['Dr. Antonio Reyes', 'Dr. Isabella Santos', 'Dr. Pablo Mendez'],
    publishedDate: 'Dec 2025',
    icon: 'globe'
  },
  {
    id: 'R-5',
    title: 'Community Impact Research',
    description: 'Socio-economic benefits of mangrove conservation programs',
    fullContent: 'This socio-economic study documents the community benefits derived from mangrove conservation initiatives in Panabo City. The research shows that 1 hectare of mangrove forest supports 8-10 local jobs through fishing, eco-tourism, and conservation activities. Communities living near mangrove areas experience 35% better food security and 22% higher average household incomes. The study also documents traditional ecological knowledge and community stewardship practices that enhance conservation outcomes.',
    authors: ['Dr. Elena Rivas', 'Dr. Fernando Lopez', 'Dr. Mariana Diaz'],
    publishedDate: 'Nov 2025',
    icon: 'book'
  },
  {
    id: 'R-6',
    title: 'Climate Resilience Assessment',
    description: 'Evaluating mangrove resilience to climate change impacts',
    fullContent: 'A comprehensive climate resilience study modeling mangrove ecosystem response to projected climate scenarios. Our analysis shows that diverse, well-connected mangrove forests are significantly more resilient to climate stressors including sea level rise, extreme weather events, and temperature fluctuations. The study identifies 4 priority adaptation strategies and recommends expansion of mangrove coverage in resilience corridors. Results indicate that a 25% increase in mangrove forest cover could mitigate 18% of regional climate vulnerability.',
    authors: ['Dr. Victoria Patel', 'Dr. Robert Chang', 'Dr. Lucia Morales'],
    publishedDate: 'Oct 2025',
    icon: 'chart'
  }
];

type MappingTab = 'map' | 'mapping' | 'monitoring' | 'reports';

interface MappingAreasProps {
  initialTab?: MappingTab;
}

const barangayOptions = [
  'A. O. Floirendo', 'Datu Abdul Dadia', 'Buenavista', 'Cacao', 'Cagangohan',
  'Consolacion', 'Dapco', 'Gredu (Poblacion)', 'J.P. Laurel', 'Kasilak',
  'Katipunan', 'Katualan', 'Kauswagan', 'Kiotoy', 'Little Panay',
  'Lower Panaga (Roxas)', 'Mabunao', 'Maduao', 'Malativas', 'Manay', 'Nanyo',
  'New Malaga (Dalisay)', 'New Malitbog', 'New Pandan (Poblacion)', 'New Visayas',
  'Quezon', 'Salvacion', 'San Francisco (Poblacion)', 'San Nicolas', 'San Pedro',
  'San Roque', 'San Vicente', 'Santa Cruz', 'Santo Niño (Poblacion)', 'Sindaton',
  'Southern Davao', 'Tagpore', 'Tibungol', 'Upper Licanan', 'Waterfall',
];

const speciesOptions = [
  'Rhizophora apiculata',
  'Avicennia marina',
  'Sonneratia alba',
  'Bruguiera gymnorrhiza',
];

const plantingMethods = [
  'Direct Planting',
  'Seedling Transplant',
  'Propagule Planting',
];

const conditionOptions = ['Good', 'Fair', 'Poor'];
const survivalOptions = ['Alive', 'Dead'];

export function MappingAreas({ initialTab = 'map' }: MappingAreasProps) {
  const [selectedArea, setSelectedArea] = useState<PlantingArea | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ area: PlantingArea; key: number } | null>(null);
  const circleRefs = useRef<Map<string, LeafletCircleMarker>>(new Map());
  const [activeTab, setActiveTab] = useState<MappingTab>(initialTab);
  const [selectedResearch, setSelectedResearch] = useState<ResearchStudy | null>(null);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRecord, setEditingRecord] = useState<MonitoringRecord | null>(null);
  const [selectedHistorySite, setSelectedHistorySite] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('Monitoring Summary');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('All Reports');
  const [reportPage, setReportPage] = useState(1);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [tileIndex, setTileIndex] = useState(0);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const tileConfig = tileProviders[tileIndex] ?? tileProviders[0];
  const showTileError = tileIndex === tileProviders.length - 1 && tileErrorCount > 0;
  const RECORDS_PER_PAGE = 8;

  const EMPTY_HEATMAP: HeatmapData = { healthy: [], at_risk: [], dead: [] };
  const [heatmapData, setHeatmapData] = useState<HeatmapData>(EMPTY_HEATMAP);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showLiveRecords, setShowLiveRecords] = useState(true);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(apiUrl('/api/monitoring/heatmap.php'));
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      const json = await response.json();
      // Validate the response shape
      if (json && Array.isArray(json.healthy) && Array.isArray(json.at_risk) && Array.isArray(json.dead)) {
        setHeatmapData(json as HeatmapData);
      } else {
        console.warn('Heatmap API returned unexpected shape', json);
      }
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    }
  };


  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch monitoring records when monitoring or reports tab is active
  useEffect(() => {
    if (activeTab === 'monitoring' || activeTab === 'reports') {
      fetchMonitoringRecords();
    }
  }, [activeTab]);

  const fetchMonitoringRecords = async (options: { resetPage?: boolean; silent?: boolean } = {}) => {
    const { resetPage = true, silent = false } = options;
    if (!silent) {
      setIsLoadingRecords(true);
    }
    setRecordsError(null);
    if (resetPage) {
      setCurrentPage(1);
    }
    try {
      const response = await fetch(apiUrl('/api/monitoring/get-records.php'));
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring records');
      }
      const data = await response.json();
      setMonitoringRecords(data.records || []);
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'Failed to load records');
      setMonitoringRecords([]);
    } finally {
      if (!silent) {
        setIsLoadingRecords(false);
      }
    }
  };

  const formatDateRangeLabel = () => {
    if (!reportFromDate && !reportToDate) return 'All dates';
    if (reportFromDate && reportToDate) return `${reportFromDate} to ${reportToDate}`;
    return reportFromDate ? `From ${reportFromDate}` : `Until ${reportToDate}`;
  };

  const getFilteredRecords = () => {
    return monitoringRecords.filter((record) => {
      const recordDate = record.monitoring_date || record.date_planted || record.created_at || '';
      if (!recordDate) return false;
      const recordTimestamp = new Date(recordDate).getTime();
      if (reportFromDate && recordTimestamp < new Date(reportFromDate).getTime()) {
        return false;
      }
      if (reportToDate && recordTimestamp > new Date(reportToDate).getTime()) {
        return false;
      }
      return true;
    });
  };

  const createCsvBlob = (records: MonitoringRecord[]) => {
    const headers = ['Site Name', 'Barangay', 'Species', 'Planting Date', 'Monitoring Date', 'Status', 'Survival'];
    const rows = records.map((record) => [
      record.site_name,
      record.barangay,
      record.species,
      record.date_planted,
      record.monitoring_date,
      record.condition_status,
      record.survival_status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  const createPdfBlob = (records: MonitoringRecord[], title: string) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(18);
    doc.text(title, 40, 50);
    doc.setFontSize(11);
    doc.text(`Date range: ${formatDateRangeLabel()}`, 40, 72);
    doc.text(`Generated: ${formatPHDateShort(new Date().toISOString())}`, 40, 88);
    doc.setFontSize(12);

    const summaryLines = [
      `Total records: ${records.length}`,
      `Selected format: ${reportFormat.toUpperCase()}`,
    ];
    summaryLines.forEach((line, index) => {
      doc.text(line, 40, 112 + index * 16);
    });

    const tableStartY = 144;
    const header = ['Site', 'Barangay', 'Species', 'Status', 'Survival'];
    const rowHeight = 18;
    const maxRows = 12;

    doc.setFontSize(10);
    header.forEach((label, index) => doc.text(label, 40 + index * 90, tableStartY));

    const visibleRows = records.slice(0, maxRows);
    visibleRows.forEach((record, rowIndex) => {
      const y = tableStartY + (rowIndex + 1) * rowHeight;
      const rowValues = [
        record.site_name,
        record.barangay,
        record.species,
        record.condition_status,
        record.survival_status,
      ];
      rowValues.forEach((value, colIndex) => {
        doc.text(String(value).substring(0, 20), 40 + colIndex * 90, y);
      });
    });

    if (records.length > maxRows) {
      doc.text(`+ ${records.length - maxRows} more records`, 40, tableStartY + (maxRows + 1) * rowHeight);
    }

    return doc.output('blob');
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const filteredRecords = getFilteredRecords();
      const title = `${reportType} Report`;
      const dateRange = formatDateRangeLabel();
      const filename = `${reportType.replace(/\s+/g, '_').toLowerCase()}_${reportFormat}_${new Date().toISOString().slice(0, 10)}.${reportFormat}`;
      const blob = reportFormat === 'csv'
        ? createCsvBlob(filteredRecords)
        : createPdfBlob(filteredRecords, title);

      const downloadUrl = URL.createObjectURL(blob);
      const description = `Generated ${new Date().toLocaleString()} for ${dateRange}`;

      setGeneratedReports((current) => [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title,
          description,
          format: reportFormat,
          generatedAt: new Date().toLocaleString(),
          dateRange,
          filename,
          downloadUrl,
        },
        ...current,
      ]);

      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    const link = document.createElement('a');
    link.href = report.downloadUrl;
    link.download = report.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);
  const [isProgressMode, setIsProgressMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    site_name: string;
    barangay: string;
    latitude: string;
    longitude: string;
    species: string;
    date_planted: string;
    planting_method: string;
    number_seedlings: string;
    monitoring_date: string;
    condition_status: string;
    current_height_cm: string;
    survival_status: string;
    remarks: string;
    growing_count: string;
    at_risk_count: string;
    dead_count: string;
  }>({
    site_name: '',
    barangay: '',
    latitude: '',
    longitude: '',
    species: '',
    date_planted: '',
    planting_method: '',
    number_seedlings: '',
    monitoring_date: '',
    condition_status: '',
    current_height_cm: '',
    survival_status: '',
    remarks: '',
    growing_count: '',
    at_risk_count: '',
    dead_count: '',
  });

  const openEditModal = (record: MonitoringRecord) => {
    setIsProgressMode(false);
    setEditingRecord(record);
    setEditForm({
      site_name: record.site_name,
      barangay: record.barangay,
      latitude: record.latitude,
      longitude: record.longitude,
      species: record.species,
      date_planted: record.date_planted,
      planting_method: record.planting_method || '',
      number_seedlings: String(record.number_seedlings),
      monitoring_date: record.monitoring_date,
      condition_status: record.condition_status,
      current_height_cm: record.current_height_cm !== null ? String(record.current_height_cm) : '',
      survival_status: record.survival_status,
      remarks: record.remarks || '',
      growing_count: record.growing_count !== null ? String(record.growing_count) : '',
      at_risk_count: record.at_risk_count !== null ? String(record.at_risk_count) : '',
      dead_count: record.dead_count !== null ? String(record.dead_count) : '',
    });
  };

  const openProgressModal = (record: MonitoringRecord) => {
    setIsProgressMode(true);
    setEditingRecord(record);
    
    // Total seedlings for the new progress update should adjust to exclude already dead seedlings
    const lastGrowing = record.growing_count !== null ? record.growing_count : record.number_seedlings;
    const lastAtRisk = record.at_risk_count !== null ? record.at_risk_count : 0;
    const total = lastGrowing + lastAtRisk;

    setEditForm({
      site_name: record.site_name,
      barangay: record.barangay,
      latitude: record.latitude,
      longitude: record.longitude,
      species: record.species,
      date_planted: record.date_planted,
      planting_method: record.planting_method || '',
      number_seedlings: String(total),
      monitoring_date: new Date().toISOString().slice(0, 10),
      condition_status: '',
      current_height_cm: '',
      survival_status: '',
      remarks: '',
      growing_count: String(total),
      at_risk_count: '0',
      dead_count: '0',
    });
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setIsProgressMode(false);
  };

  const handleGrowingCountChange = (val: string) => {
    const total = parseInt(editForm.number_seedlings, 10) || 0;
    const growing = Math.min(total, Math.max(0, parseInt(val, 10) || 0));
    const currentAtRisk = parseInt(editForm.at_risk_count, 10) || 0;
    
    let newDead = total - growing - currentAtRisk;
    let newAtRisk = currentAtRisk;
    if (newDead < 0) {
      newAtRisk = Math.max(0, total - growing);
      newDead = 0;
    }
    
    setEditForm(prev => ({
      ...prev,
      growing_count: val,
      dead_count: String(newDead),
      at_risk_count: String(newAtRisk)
    }));
  };

  const handleAtRiskCountChange = (val: string) => {
    const total = parseInt(editForm.number_seedlings, 10) || 0;
    const atRisk = Math.min(total, Math.max(0, parseInt(val, 10) || 0));
    const currentDead = parseInt(editForm.dead_count, 10) || 0;
    
    let newGrowing = total - atRisk - currentDead;
    let newDead = currentDead;
    if (newGrowing < 0) {
      newDead = Math.max(0, total - atRisk);
      newGrowing = 0;
    }
    
    setEditForm(prev => ({
      ...prev,
      at_risk_count: val,
      growing_count: String(newGrowing),
      dead_count: String(newDead)
    }));
  };

  const handleDeadCountChange = (val: string) => {
    const total = parseInt(editForm.number_seedlings, 10) || 0;
    const dead = Math.min(total, Math.max(0, parseInt(val, 10) || 0));
    const currentAtRisk = parseInt(editForm.at_risk_count, 10) || 0;
    
    let newGrowing = total - dead - currentAtRisk;
    let newAtRisk = currentAtRisk;
    if (newGrowing < 0) {
      newAtRisk = Math.max(0, total - dead);
      newGrowing = 0;
    }
    
    setEditForm(prev => ({
      ...prev,
      dead_count: val,
      growing_count: String(newGrowing),
      at_risk_count: String(newAtRisk)
    }));
  };

  const handleUpdateRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const total = parseInt(editForm.number_seedlings, 10) || 0;
    const growing = parseInt(editForm.growing_count, 10) || 0;
    const atRisk = parseInt(editForm.at_risk_count, 10) || 0;
    const dead = parseInt(editForm.dead_count, 10) || 0;

    if (growing + atRisk + dead !== total) {
      alert(`Growing + At Risk + Dead must equal the total number of seedlings (${total}).`);
      return;
    }

    setIsUpdatingRecord(true);
    try {
      const derivedStatus = editForm.planting_method === 'Direct Planting'
        ? 'Newly Planted'
        : (dead >= total
            ? 'Not Surviving'
            : (growing >= atRisk && growing >= dead
                ? 'Surviving'
                : (atRisk >= growing && atRisk >= dead ? 'At Risk' : 'Not Surviving')));

      const derivedCondition = dead === total ? 'Poor' : atRisk > 0 ? 'Fair' : 'Good';

      const response = await fetch(apiUrl('/api/monitoring/update-record.php'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          ...editForm,
          survival_status: derivedStatus,
          condition_status: derivedCondition,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update record');
      }

      alert('Record updated successfully!');
      await fetchMonitoringRecords({ resetPage: false });
      closeEditModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error updating record');
    } finally {
      setIsUpdatingRecord(false);
    }
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = parseInt(editForm.number_seedlings, 10) || 0;
    const growing = parseInt(editForm.growing_count, 10) || 0;
    const atRisk = parseInt(editForm.at_risk_count, 10) || 0;
    const dead = parseInt(editForm.dead_count, 10) || 0;

    if (growing + atRisk + dead !== total) {
      alert(`Growing + At Risk + Dead must equal the total number of seedlings (${total}).`);
      return;
    }

    setIsUpdatingRecord(true);
    try {
      const formData = new FormData();
      formData.append('site_name', editForm.site_name);
      formData.append('barangay', editForm.barangay);
      formData.append('latitude', editForm.latitude);
      formData.append('longitude', editForm.longitude);
      formData.append('species', editForm.species);
      formData.append('date_planted', editForm.date_planted);
      formData.append('planting_method', editForm.planting_method);
      formData.append('number_seedlings', editForm.number_seedlings);
      formData.append('monitoring_date', editForm.monitoring_date);
      formData.append('current_height_cm', editForm.current_height_cm);
      formData.append('growing_count', String(growing));
      formData.append('at_risk_count', String(atRisk));
      formData.append('dead_count', String(dead));
      const derivedStatus = deriveStatus(growing, atRisk, dead, total, editForm.planting_method);
      formData.append('survival_status', derivedStatus);
      formData.append('condition', dead === total ? 'Poor' : atRisk > 0 ? 'Fair' : 'Good');
      formData.append('remarks', editForm.remarks);
      formData.append('status', 'published');

      const response = await fetch(apiUrl('/api/monitoring/add-record.php'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add progress update');
      }

      alert('Progress update added successfully!');
      await fetchMonitoringRecords({ resetPage: false });
      closeEditModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error adding progress update');
    } finally {
      setIsUpdatingRecord(false);
    }
  };


  const deleteRecord = async (recordId: number, deleteEntireHistory: boolean = false) => {
    const targetRecord = monitoringRecords.find(r => r.id === recordId);
    const confirmMessage = deleteEntireHistory
      ? `Are you sure you want to delete the ENTIRE monitoring history for "${targetRecord?.site_name}"? This will delete all progress updates and cannot be undone.`
      : 'Are you sure you want to delete this record? This action cannot be undone.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/monitoring/delete-record.php'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, delete_entire_history: deleteEntireHistory }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete record');
      }

      if (deleteEntireHistory && targetRecord) {
        setMonitoringRecords(records => records.filter(r => r.site_name !== targetRecord.site_name));
      } else {
        setMonitoringRecords(records => records.filter(r => r.id !== recordId));
      }
      setCurrentPage(1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete record');
    }
  };

  const filteredReports = reportFilter === 'All Reports'
    ? generatedReports
    : generatedReports.filter((report) => report.title.includes(reportFilter));
  const REPORTS_PER_PAGE_DISPLAY = 5;
  const reportTotalPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE_DISPLAY));
  const reportStartIndex = (reportPage - 1) * REPORTS_PER_PAGE_DISPLAY;
  const reportEndIndex = reportStartIndex + REPORTS_PER_PAGE_DISPLAY;
  const reportPageRows = filteredReports.slice(reportStartIndex, reportEndIndex);

  // Filter monitoringRecords to keep only the latest record for each site (for the main table view)
  const latestMonitoringRecords = useMemo(() => {
    const latestMap = new Map<string, MonitoringRecord>();
    
    // Sort records so the latest monitoring date / highest ID comes first
    const sortedRecords = [...monitoringRecords].sort((a, b) => {
      const dateDiff = new Date(b.monitoring_date).getTime() - new Date(a.monitoring_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    });

    for (const record of sortedRecords) {
      if (!latestMap.has(record.site_name)) {
        latestMap.set(record.site_name, record);
      }
    }
    
    // Find the minimum ID (original ID) for each site name
    const originalIdMap = new Map<string, number>();
    for (const record of monitoringRecords) {
      const currentMin = originalIdMap.get(record.site_name);
      if (currentMin === undefined || record.id < currentMin) {
        originalIdMap.set(record.site_name, record.id);
      }
    }
    
    // Attach the original ID as displayId to the latest record
    return Array.from(latestMap.values()).map(record => ({
      ...record,
      displayId: originalIdMap.get(record.site_name) ?? record.id
    }));
  }, [monitoringRecords]);

  // Dynamically calculate plantingAreas from latest database records
  const plantingAreas = useMemo<PlantingArea[]>(() => {
    return latestMonitoringRecords.map((record) => {
      const lat = Number(record.latitude);
      const lng = Number(record.longitude);
      
      let health: 'healthy' | 'monitoring' | 'critical' = 'healthy';
      if (record.survival_status === 'Not Surviving' || record.survival_status === 'Dead') {
        health = 'critical';
      } else if (record.survival_status === 'At Risk' || record.condition_status === 'Poor' || record.condition_status === 'Fair') {
        health = 'monitoring';
      }

      return {
        id: String(record.displayId),
        name: record.site_name,
        position: { 
          lat: Number.isNaN(lat) ? 7.6012 : lat, 
          lng: Number.isNaN(lng) ? 125.6900 : lng 
        },
        species: record.species,
        plantedDate: record.date_planted,
        totalPlants: record.number_seedlings,
        healthStatus: health,
        description: record.remarks || `Planting area in Barangay ${record.barangay}`
      };
    });
  }, [latestMonitoringRecords]);

  // Pagination calculations
  const totalPages = Math.ceil(latestMonitoringRecords.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const currentRecords = latestMonitoringRecords.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Surviving':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'At Risk':
        return 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'Not Surviving':
      case 'Dead':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'Newly Planted':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Surviving':
        return 'Surviving';
      case 'At Risk':
        return 'At Risk';
      case 'Not Surviving':
      case 'Dead':
        return 'Not Surviving';
      case 'Newly Planted':
        return 'Newly Planted';
      default:
        return status;
    }
  };

  /** Derive survival_status from the three counts */
  const deriveStatus = (growing: number, atRisk: number, dead: number, total: number, plantingMethod: string): string => {
    if (plantingMethod === 'Direct Planting' && growing === total && atRisk === 0 && dead === 0) return 'Newly Planted';
    if (dead >= total) return 'Not Surviving';
    if (growing >= atRisk && growing >= dead) return 'Surviving';
    if (atRisk >= growing && atRisk >= dead) return 'At Risk';
    return 'Not Surviving';
  };

  const isMapView = activeTab === 'map' || activeTab === 'mapping';
  const isMonitoringView = activeTab === 'monitoring';
  const isReportsView = activeTab === 'reports';

  useEffect(() => {
    if (!isMapView) {
      return;
    }

    fetchMonitoringRecords({ resetPage: false, silent: true });
    fetchHeatmapData();
    const intervalId = window.setInterval(() => {
      fetchMonitoringRecords({ resetPage: false, silent: true });
      fetchHeatmapData();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isMapView]);

  // Center on Panabo City, Philippines
  const mapCenter = { lat: 7.6012, lng: 125.6900 };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#2d6a4f';
      case 'monitoring':
        return '#f59e0b';
      case 'critical':
        return '#d4183d';
      default:
        return '#2d6a4f';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-primary/10 text-primary',
      monitoring: 'bg-yellow-100 text-yellow-700',
      critical: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || colors.healthy;
  };

  const markerStyle = useMemo(() => ({
    weight: 2,
    color: '#ffffff',
    fillOpacity: 0.9,
  }), []);

  const recordMarkerStyle = useMemo(() => ({
    weight: 1,
    color: '#0f172a',
    fillOpacity: 0.85,
  }), []);

  const liveRecords = useMemo(() => monitoringRecords
    .map((record) => {
      const lat = Number(record.latitude);
      const lng = Number(record.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return null;
      }
      return { record, position: { lat, lng } };
    })
    .filter((item): item is { record: MonitoringRecord; position: { lat: number; lng: number } } => Boolean(item)),
  [monitoringRecords]);

  const getRecordMarkerColor = (status: string) => {
    switch (status) {
      case 'Alive':
        return '#2563eb';
      case 'Dead':
        return '#dc2626';
      default:
        return '#0ea5e9';
    }
  };

  const MapSizeFix = () => {
    const map = useMap();

    useEffect(() => {
      const handleResize = () => map.invalidateSize();
      const timerId = window.setTimeout(() => map.invalidateSize(), 0);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.clearTimeout(timerId);
      };
    }, [map]);

    return null;
  };

  // Inner component: flies to area and opens its popup
  const FlyToMarker = ({ target }: { target: { area: PlantingArea; key: number } | null }) => {
    const map = useMap();
    useEffect(() => {
      if (!target) return;
      const { area } = target;
      map.flyTo([area.position.lat, area.position.lng], 15, { duration: 1.4 });
      setTimeout(() => {
        const marker = circleRefs.current.get(area.id);
        if (marker) marker.openPopup();
      }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target?.key]);
    return null;
  };

  return (
    <div className="space-y-6">
      {!isReportsView && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1>
              {isMonitoringView
                ? 'Monitoring Overview'
                : 'Mapping Area'}
            </h1>
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panabo City, Philippines
              </span>
            </div>
          </div>
          <p className="text-muted-foreground">
            {isMonitoringView
              ? 'Real-time monitoring status for vulnerable and newly planted zones'
              : 'Comprehensive mapping across mangrove planting sites'}
          </p>
        </div>
      )}

      {isMapView && (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden shadow-sm flex flex-col min-h-[600px]">
          <div className="flex-1 w-full relative">
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom
              className="absolute inset-0 h-full w-full"
            >
              <MapSizeFix />
              <FlyToMarker target={flyTarget} />
              <TileLayer
                attribution={tileConfig.attribution}
                url={tileConfig.url}
                subdomains={tileConfig.subdomains ?? 'abc'}
                eventHandlers={{
                  tileerror: () => {
                    setTileErrorCount((count) => count + 1);
                    setTileIndex((current) => (
                      current < tileProviders.length - 1 ? current + 1 : current
                    ));
                  },
                }}
              />
              {showHeatmap && (
                heatmapData.healthy.length > 0 || heatmapData.at_risk.length > 0 || heatmapData.dead.length > 0
              ) && (
                <HeatmapLayer data={heatmapData} />
              )}
              {/* Panabo City boundary from OSM relation 11768007 */}
              <Polygon
                positions={[
                  [7.2492335,125.5464363],[7.2461683,125.5499868],[7.2211967,125.5499864],[7.2211935,125.5762946],[7.2211903,125.6033609],[7.2212294,125.6034118],[7.2212693,125.603491],[7.2213159,125.6035754],[7.2213824,125.6036317],[7.2214622,125.6036505],[7.2215793,125.6036425],[7.2216352,125.6036451],[7.221739,125.6036907],[7.2218693,125.6037122],[7.2220583,125.6037283],[7.2222818,125.6037927],[7.2225771,125.6038839],[7.2227022,125.6039348],[7.222814,125.6040099],[7.2228565,125.6040716],[7.2228619,125.6041548],[7.2228459,125.6043211],[7.2228619,125.6044283],[7.2228991,125.6045356],[7.222939,125.6045973],[7.2230322,125.60471],[7.2230561,125.6048441],[7.2230934,125.6050023],[7.2231093,125.6050935],[7.223112,125.6051338],[7.2231492,125.6051955],[7.2232184,125.6052357],[7.2232956,125.6052652],[7.2234127,125.6052759],[7.2235377,125.6052491],[7.2236628,125.6051955],[7.2239688,125.6049594],[7.224038,125.6049514],[7.2240992,125.6049675],[7.2241285,125.605292],[7.2241524,125.6050989],[7.2241098,125.6053027],[7.2240167,125.6056756],[7.2240061,125.6057909],[7.2240061,125.605976],[7.224022,125.6062174],[7.2240593,125.6063327],[7.2241285,125.60644],[7.2241498,125.6064668],[7.2241976,125.606491],[7.2242668,125.6064829],[7.2244025,125.6064159],[7.2245356,125.6063327],[7.2247245,125.6062549],[7.2249055,125.6061932],[7.2249746,125.6061771],[7.2250172,125.6061262],[7.2250172,125.6060377],[7.22498,125.6058848],[7.2249986,125.6058285],[7.2250225,125.6057855],[7.2250891,125.6057695],[7.2251742,125.6057909],[7.2253152,125.6058446],[7.2254563,125.6059197],[7.2255387,125.6060001],[7.2255866,125.6060216],[7.2256691,125.606035],[7.2259831,125.6058834],[7.226055,125.6058365],[7.2262865,125.6057721],[7.2264834,125.6057078],[7.2266723,125.6056192],[7.2269011,125.6055388],[7.2271832,125.6054932],[7.2273774,125.6054771],[7.2274652,125.6054825],[7.2275637,125.6055146],[7.2276409,125.6055817],[7.2276834,125.6056568],[7.22771,125.6057963],[7.2276994,125.6060699],[7.2276675,125.6063408],[7.2276329,125.6064802],[7.2276063,125.6066331],[7.2276089,125.6067404],[7.2276329,125.6067646],[7.2276888,125.606778],[7.227867,125.6067163],[7.2279309,125.6067243],[7.2281837,125.6067914],[7.2282396,125.6068209],[7.2286201,125.6071588],[7.2287691,125.6073037],[7.228817,125.6073841],[7.2288835,125.6075236],[7.2289261,125.6075934],[7.2289953,125.6076309],[7.2291895,125.6077489],[7.2292826,125.6077597],[7.2293837,125.6077301],[7.2296152,125.6076363],[7.2299106,125.6075022],[7.2299771,125.6074887],[7.2300303,125.6074914],[7.2301448,125.6075317],[7.2302272,125.6075853],[7.2303044,125.6076416],[7.2303842,125.607757],[7.2304614,125.6079715],[7.2305332,125.6081566],[7.2306024,125.6082478],[7.2306583,125.6083041],[7.2307381,125.6083363],[7.2309004,125.6083336],[7.2310362,125.6083497],[7.231116,125.6083819],[7.2311878,125.6084222],[7.2312304,125.6084678],[7.2312304,125.6085402],[7.2312011,125.6086045],[7.231084,125.6087869],[7.2309297,125.6089666],[7.2308685,125.6090578],[7.2308392,125.6091651],[7.2308286,125.6092644],[7.2308765,125.6095004],[7.2309004,125.6095916],[7.2310095,125.6098223],[7.2313688,125.6103373],[7.2314912,125.6105813],[7.2315151,125.6106806],[7.2315071,125.6108013],[7.2314512,125.6108764],[7.2313741,125.6109408],[7.2311586,125.6110802],[7.2310787,125.6111661],[7.2310335,125.6112814],[7.2309776,125.6114638],[7.2309696,125.6115684],[7.2309696,125.6116623],[7.2309803,125.6117266],[7.2310176,125.6118151],[7.2310974,125.6118903],[7.2311719,125.6119224],[7.2315258,125.6120163],[7.2316295,125.6120324],[7.2318025,125.612019],[7.2319249,125.6120056],[7.2319887,125.612019],[7.2320473,125.6120673],[7.2320792,125.6121075],[7.2321032,125.612188],[7.2320952,125.6122819],[7.2320233,125.6128129],[7.2320207,125.6128719],[7.2320579,125.6129336],[7.2321138,125.6129792],[7.2322602,125.6130543],[7.2323214,125.6130731],[7.2323826,125.6130812],[7.2327418,125.6130624],[7.2328429,125.6130865],[7.232944,125.6131643],[7.2332207,125.6134003],[7.2333484,125.6134862],[7.2334336,125.6135264],[7.2335241,125.6135479],[7.2336305,125.6135425],[7.2337023,125.6134969],[7.2338354,125.6133386],[7.2339285,125.613175],[7.2339551,125.6131348],[7.2340749,125.6131026],[7.2342239,125.6131321],[7.2343702,125.6131858],[7.2345804,125.613234],[7.2347667,125.6132984],[7.2349051,125.6133521],[7.2349583,125.6134164],[7.2349716,125.6134701],[7.2349051,125.6138107],[7.2348412,125.6140199],[7.2347374,125.6143203],[7.2347241,125.6144223],[7.2347294,125.6145269],[7.2347587,125.6146395],[7.2348066,125.6147227],[7.2348305,125.6147361],[7.2349024,125.6147334],[7.2351472,125.6146181],[7.2351924,125.6145564],[7.2351977,125.6144625],[7.235219,125.6143767],[7.2353148,125.6142613],[7.2353946,125.6142318],[7.2354825,125.6142157],[7.2357033,125.614213],[7.235839,125.6142452],[7.2359029,125.6142479],[7.2360093,125.6142345],[7.2360838,125.6142077],[7.2362009,125.6141406],[7.2362701,125.6141406],[7.2363978,125.6141674],[7.236475,125.6142238],[7.2365228,125.6142962],[7.2365335,125.6143445],[7.2364909,125.6146395],[7.2365042,125.6147119],[7.2365388,125.6147763],[7.2366905,125.614897],[7.2367304,125.6149533],[7.2367517,125.6150392],[7.2367437,125.6151196],[7.236624,125.6153664],[7.2365335,125.6155944],[7.2364909,125.6157258],[7.2364962,125.6158009],[7.2365362,125.6158385],[7.236584,125.6158626],[7.2367091,125.6158867],[7.2367756,125.6158894],[7.2369113,125.6158733],[7.2370364,125.6158036],[7.2371082,125.615699],[7.2371508,125.6155702],[7.2371561,125.6154039],[7.2371934,125.6153101],[7.2372147,125.6152403],[7.2372652,125.6152081],[7.2374222,125.6151947],[7.2379437,125.6151921],[7.2381327,125.6151733],[7.2382896,125.615125],[7.2383695,125.6150821],[7.2384573,125.6150553],[7.2385052,125.6150579],[7.238569,125.6150848],[7.2385903,125.6151277],[7.2386382,125.6152564],[7.2386941,125.6154442],[7.2387713,125.6157231],[7.2388112,125.6158197],[7.2389415,125.6160504],[7.2391172,125.6165037],[7.2391544,125.6165385],[7.2392236,125.616568],[7.2392795,125.6165788],[7.2393779,125.6165519],[7.2394577,125.6164795],[7.2395216,125.6163347],[7.2395509,125.6162569],[7.239809,125.6159484],[7.2398702,125.6159109],[7.2400165,125.6158841],[7.2400804,125.6159028],[7.2401442,125.6159565],[7.2402267,125.6160879],[7.2402613,125.6161952],[7.2402666,125.6163347],[7.2402666,125.6164902],[7.2402906,125.6166136],[7.2403145,125.6166646],[7.2403544,125.6166914],[7.2404263,125.6166834],[7.2405088,125.6166297],[7.240578,125.6165278],[7.2406232,125.6164286],[7.2406817,125.6161308],[7.2406764,125.6160155],[7.240703,125.6159109],[7.2407802,125.6157553],[7.2409797,125.6154656],[7.2410729,125.6153932],[7.2412192,125.6153342],[7.2414108,125.6152832],[7.24148,125.6152806],[7.2415545,125.6153128],[7.2415944,125.615353],[7.2416982,125.615522],[7.2419057,125.6158975],[7.2420973,125.6161872],[7.2421665,125.6162757],[7.242225,125.6162998],[7.2422835,125.6163025],[7.2423953,125.6162864],[7.2425736,125.6162167],[7.2426747,125.6161523],[7.2433186,125.6155246],[7.2436033,125.615361],[7.2437443,125.6152457],[7.2438348,125.615117],[7.243896,125.6150579],[7.2439678,125.6150338],[7.2440317,125.6150311],[7.2440796,125.6150526],[7.2441434,125.6151035],[7.2442126,125.6151921],[7.2443217,125.6153986],[7.244359,125.6155112],[7.2443616,125.6155997],[7.2443457,125.6157097],[7.2442605,125.6159243],[7.2442446,125.6160128],[7.2442552,125.6161201],[7.2443137,125.6162328],[7.2444893,125.6165224],[7.2445346,125.6165707],[7.2445745,125.6165922],[7.2447022,125.6166378],[7.2448858,125.6166512],[7.2450321,125.6166404],[7.245096,125.616619],[7.2451519,125.6165519],[7.2452211,125.6164044],[7.2453089,125.616096],[7.2453568,125.6160504],[7.2456016,125.6160155],[7.2457186,125.6160369],[7.2460486,125.6161898],[7.2462162,125.6162435],[7.2463891,125.6162757],[7.2465115,125.616273],[7.2466419,125.6162515],[7.246908,125.6161255],[7.2471688,125.6160289],[7.2472353,125.6160316],[7.2473204,125.6160611],[7.2474481,125.6161308],[7.24752,125.6162113],[7.2476477,125.6164768],[7.2477062,125.6165895],[7.2477461,125.6166968],[7.2477914,125.6167182],[7.2478499,125.6167263],[7.247959,125.616678],[7.248132,125.6165573],[7.2484433,125.616273],[7.2485258,125.6161764],[7.2486189,125.6161094],[7.2487173,125.6160665],[7.2488051,125.6160477],[7.2489116,125.6160691],[7.2489887,125.6160986],[7.2490207,125.6161496],[7.2490473,125.6162944],[7.2490845,125.616678],[7.2490819,125.6168443],[7.2490686,125.6170455],[7.2490739,125.6173164],[7.2491005,125.6174961],[7.2491351,125.6175739],[7.2492096,125.6176677],[7.2492867,125.6177804],[7.2493479,125.617885],[7.2494091,125.6180325],[7.249473,125.6181264],[7.2495262,125.6182229],[7.2495581,125.6183785],[7.2495741,125.6184885],[7.2495714,125.6185958],[7.2495874,125.6186628],[7.2496247,125.6187299],[7.2497178,125.6188157],[7.2499865,125.618872],[7.2501648,125.6189042],[7.2504255,125.6189471],[7.2504814,125.6189525],[7.2505373,125.6189445],[7.2508353,125.6188613],[7.2509577,125.6188372],[7.2515085,125.6188104],[7.2516255,125.618813],[7.2517267,125.6188425],[7.2518384,125.6189096],[7.2519129,125.6189632],[7.2520114,125.6190115],[7.2522402,125.6191081],[7.2522961,125.6191564],[7.2523333,125.6192288],[7.2523227,125.6193119],[7.2522828,125.6193978],[7.2520832,125.6197277],[7.2519954,125.6198537],[7.2518703,125.6200093],[7.2518278,125.6200978],[7.2517799,125.6202614],[7.2517852,125.6203473],[7.2518065,125.6204277],[7.2518384,125.6204948],[7.2519182,125.6205779],[7.2521896,125.6208059],[7.2522774,125.6208757],[7.2526739,125.6210527],[7.252751,125.6210983],[7.2528415,125.6211787],[7.2528947,125.6212029],[7.2529985,125.6212136],[7.2533737,125.621168],[7.2538526,125.6210473],[7.2543368,125.6208944],[7.2546322,125.6208086],[7.2547626,125.6207469],[7.254853,125.6207201],[7.2550074,125.6207067],[7.2551457,125.6206852],[7.2553772,125.6206101],[7.2556592,125.6204626],[7.2557923,125.6204036],[7.2558614,125.6203929],[7.2559652,125.6204089],[7.2560238,125.6204411],[7.2560424,125.6205001],[7.2560211,125.6206021],[7.2559812,125.6206933],[7.255771,125.6209588],[7.2555022,125.6213263],[7.2553799,125.6215677],[7.2552947,125.6218117],[7.2552947,125.6219056],[7.255316,125.6219995],[7.2553612,125.6220585],[7.2554118,125.6220987],[7.2555688,125.6221551],[7.2556805,125.6222033],[7.2559014,125.6223106],[7.2561355,125.6224313],[7.256359,125.6225172],[7.2567448,125.6226191],[7.2568871,125.6226781],[7.2569431,125.6227357],[7.2569963,125.6228283],[7.2570042,125.6229182],[7.2569616,125.6230013],[7.2568832,125.6230375],[7.2567395,125.6230496],[7.2566477,125.6230858],[7.2565133,125.6232092],[7.256367,125.623354],[7.2562473,125.6234613],[7.256101,125.6236195],[7.2559679,125.6237966],[7.2558295,125.624038],[7.2557816,125.6241748],[7.2557284,125.6244484],[7.2556113,125.6253281],[7.2556167,125.6255829],[7.25563,125.6256607],[7.2556779,125.6257492],[7.2559572,125.6261489],[7.2560424,125.6262052],[7.2561568,125.6262079],[7.2562127,125.6261918],[7.2562526,125.626165],[7.2562685,125.6260443],[7.2563111,125.6259692],[7.2563803,125.6258807],[7.2565,125.6257519],[7.2566251,125.6256393],[7.2567315,125.6255373],[7.2568193,125.6254274],[7.2568991,125.6252235],[7.2569896,125.6248748],[7.2570082,125.6246522],[7.2569843,125.6245315],[7.2569071,125.6243652],[7.2568832,125.6243008],[7.2568645,125.6242231],[7.2568938,125.6241479],[7.2569444,125.6241077],[7.2570029,125.6241238],[7.257261,125.6243116],[7.257426,125.6244457],[7.2575962,125.6245691],[7.2577346,125.6246549],[7.2578118,125.6247649],[7.257849,125.6248587],[7.257865,125.6249848],[7.2578863,125.6250304],[7.2579448,125.6250814],[7.2580938,125.6251243],[7.2581843,125.6251296],[7.2582721,125.6251162],[7.2583732,125.6250814],[7.2584902,125.6250089],[7.2586126,125.6248802],[7.2586579,125.6248775],[7.2587776,125.6249204],[7.2589213,125.625025],[7.2590543,125.6252101],[7.2591581,125.6254193],[7.2592565,125.6255937],[7.2592725,125.6256661],[7.2592725,125.6257224],[7.2592219,125.6258485],[7.2591528,125.6259316],[7.259033,125.6260067],[7.258908,125.6260201],[7.2588388,125.625996],[7.2587137,125.6258914],[7.2586392,125.6258458],[7.2585355,125.6258056],[7.2584131,125.6257841],[7.2582428,125.6257895],[7.2581736,125.6258163],[7.2581177,125.625886],[7.2580645,125.6259826],[7.2580459,125.6260711],[7.2580299,125.6262293],[7.2580353,125.6264064],[7.2581124,125.6269294],[7.258139,125.6270179],[7.2582295,125.6271788],[7.258429,125.6274202],[7.2584849,125.6274444],[7.2585727,125.6274658],[7.2587084,125.6274873],[7.2587616,125.6275061],[7.2588015,125.627557],[7.2588335,125.6276214],[7.2588441,125.6278762],[7.2588707,125.6283027],[7.258892,125.6284824],[7.258908,125.628705],[7.258884,125.6288284],[7.2588042,125.6289679],[7.258727,125.6290188],[7.258602,125.629043],[7.2585275,125.6290457],[7.2583758,125.6289786],[7.2583519,125.6289384],[7.2583386,125.6288606],[7.2583812,125.6286192],[7.2583545,125.628579],[7.25832,125.6285495],[7.2582534,125.628469],[7.2580911,125.6281981],[7.2579208,125.6278977],[7.2578623,125.6278628],[7.2578011,125.6278574],[7.2577532,125.627895],[7.2576894,125.6279647],[7.2576362,125.6280398],[7.2575483,125.6282249],[7.2574925,125.628359],[7.2574712,125.6285199],[7.2574552,125.6285897],[7.2573967,125.628646],[7.2572211,125.6287184],[7.2569763,125.6288391],[7.2568752,125.6289169],[7.2568353,125.6289732],[7.25683,125.6290483],[7.2568379,125.6290886],[7.2569098,125.62933],[7.2569124,125.6293836],[7.2568645,125.6294909],[7.256806,125.6295714],[7.2566703,125.6297135],[7.2563883,125.6299469],[7.2563138,125.6300313],[7.2562739,125.6300984],[7.2561967,125.6302768],[7.2560131,125.6307006],[7.2558934,125.6309956],[7.2558136,125.6311324],[7.2557444,125.6312692],[7.2568651,125.6322496],[7.2571758,125.6324682],[7.2574712,125.6326023],[7.2579314,125.6327606],[7.2586365,125.6329751],[7.2588282,125.6330207],[7.2590849,125.6330381],[7.2593044,125.6330167],[7.25948,125.6329858],[7.2599563,125.632731],[7.2601425,125.6326559],[7.260366,125.6326103],[7.2605816,125.6325969],[7.2609487,125.6326291],[7.2609168,125.6328383],[7.2609274,125.6330274],[7.2609354,125.6331602],[7.260994,125.6332688],[7.261115,125.6333747],[7.2612321,125.6334056],[7.261437,125.6334217],[7.2616458,125.6334633],[7.2617682,125.6335303],[7.2618254,125.633592],[7.2618747,125.63371],[7.2619412,125.6338669],[7.2620143,125.6339474],[7.2620902,125.6340078],[7.262174,125.6340453],[7.2622352,125.6340721],[7.2622937,125.6341244],[7.262327,125.6342076],[7.2623296,125.6343175],[7.2623177,125.6344584],[7.2623389,125.6345482],[7.2623828,125.63463],[7.26246,125.6347226],[7.2625491,125.6347883],[7.2625664,125.6348245],[7.2625638,125.6348741],[7.2625292,125.634917],[7.2624773,125.6349868],[7.2624667,125.6350484],[7.262476,125.6351061],[7.2625146,125.6351745],[7.2625651,125.6352241],[7.2626343,125.635255],[7.2626689,125.6352845],[7.2626848,125.635369],[7.2626702,125.6354655],[7.2626356,125.6355326],[7.2625797,125.6356291],[7.2625332,125.635715],[7.2625012,125.6358249],[7.2624933,125.6359282],[7.2624946,125.6359953],[7.2625239,125.6360395],[7.2625624,125.6360503],[7.2626077,125.6360395],[7.2626622,125.636014],[7.2627208,125.6359845],[7.2628046,125.6359698],[7.2628777,125.6359698],[7.2630214,125.6360181],[7.2631691,125.6360744],[7.2632702,125.6361736],[7.2633021,125.6362756],[7.2633114,125.6363828],[7.263346,125.6365129],[7.2634099,125.6366511],[7.2635083,125.6367744],[7.2635802,125.6368388],[7.263652,125.6369448],[7.2636786,125.6370507],[7.2636706,125.6371339],[7.2636347,125.6372023],[7.2635722,125.6372385],[7.2634684,125.6372586],[7.263374,125.63728],[7.2632822,125.6373136],[7.2632316,125.6373686],[7.263197,125.637441],[7.2631797,125.637498],[7.2631598,125.6377038],[7.2631624,125.6381424],[7.2631864,125.6389028],[7.2631864,125.639808],[7.2631731,125.6401527],[7.2631664,125.640669],[7.2631744,125.6407991],[7.2632063,125.6408916],[7.2632063,125.6409654],[7.2631624,125.6410244],[7.2631179,125.6410633],[7.2630819,125.6410915],[7.2630693,125.6411471],[7.263076,125.6411867],[7.2631185,125.6412524],[7.2631737,125.6413342],[7.2632057,125.6414227],[7.263217,125.6415253],[7.2632396,125.6415823],[7.2632968,125.6416406],[7.263374,125.6416903],[7.2634884,125.641762],[7.2827723,125.6586307],[7.2825558,125.6587793],[7.282444,125.6589174],[7.282323,125.6591561],[7.2822151,125.659443],[7.2821766,125.6596953],[7.2821206,125.6604092],[7.2816684,125.6620843],[7.2815396,125.6627552],[7.2814007,125.6631144],[7.2812955,125.6631838],[7.2811882,125.663217],[7.2810765,125.6632277],[7.2809328,125.6632251],[7.2807599,125.6631848],[7.2801765,125.6630808],[7.2788907,125.6630184],[7.2785894,125.6630788],[7.2784219,125.663218],[7.2783256,125.6634021],[7.2781553,125.6637994],[7.2778342,125.6650571],[7.2775,125.6660615],[7.2769312,125.6670229],[7.2767929,125.667125],[7.2766413,125.6672028],[7.2764709,125.6672402],[7.2763273,125.6672296],[7.2762076,125.6671947],[7.2760439,125.6671068],[7.2757233,125.666748],[7.2751112,125.6652326],[7.2749247,125.6648254],[7.2745388,125.6642583],[7.2741434,125.6639718],[7.2737862,125.6638735],[7.273418,125.6639677],[7.2731811,125.6641463],[7.2730688,125.664415],[7.2726955,125.6652201],[7.2722751,125.6657542],[7.2720703,125.6659287],[7.2719612,125.6659904],[7.2718555,125.6660138],[7.2717564,125.6660092],[7.27161,125.6659341],[7.271499,125.6658322],[7.2711422,125.6653374],[7.2708659,125.6648822],[7.2704989,125.6644635],[7.2702398,125.6643087],[7.2700495,125.6642791],[7.2697568,125.6642895],[7.2691239,125.664568],[7.2685626,125.6650269],[7.2682464,125.6653],[7.2673795,125.6660417],[7.2669683,125.6663004],[7.2664121,125.6665044],[7.2654039,125.666894],[7.264977,125.6669923],[7.2645818,125.6671043],[7.2636154,125.6676037],[7.2631126,125.6677764],[7.2624254,125.667884],[7.2618637,125.667925],[7.2615986,125.6678611],[7.2612675,125.6677618],[7.2609032,125.6675833],[7.2605502,125.6672352],[7.2602593,125.6668957],[7.2598439,125.6661831],[7.2595209,125.6658105],[7.2591258,125.6657745],[7.2588268,125.6660692],[7.2585612,125.6667557],[7.2586347,125.6676694],[7.2586444,125.6679856],[7.2587203,125.6682499],[7.2588371,125.6683845],[7.2592253,125.6688269],[7.2596608,125.669254],[7.2599391,125.6694083],[7.2601119,125.6694838],[7.2604897,125.6695893],[7.2611569,125.6696141],[7.262021,125.6692712],[7.2622942,125.6692518],[7.2625854,125.6692753],[7.2627929,125.6693058],[7.2629198,125.6694705],[7.2629402,125.6699156],[7.2629065,125.6703229],[7.2627693,125.6709124],[7.2625422,125.671216],[7.2622984,125.6713624],[7.2621447,125.6714415],[7.2619249,125.6714073],[7.261594,125.6710335],[7.2613183,125.6709936],[7.2608753,125.6709545],[7.2590013,125.6712092],[7.2583957,125.6714437],[7.2578942,125.6717062],[7.2576009,125.6719719],[7.2575856,125.672358],[7.2576586,125.6726447],[7.2582175,125.672751],[7.2587751,125.6726507],[7.2592699,125.6727878],[7.2594935,125.6729267],[7.2595639,125.673331],[7.2593061,125.6738022],[7.2588095,125.6739939],[7.2585058,125.6740648],[7.2576837,125.6742503],[7.2571126,125.6745331],[7.2569763,125.6747532],[7.2566703,125.6752682],[7.2567562,125.6755217],[7.2560218,125.6763291],[7.2555156,125.6769097],[7.2552926,125.6772423],[7.2551617,125.677599],[7.2550779,125.6780253],[7.2550233,125.6784895],[7.255048,125.6787721],[7.2551351,125.6790125],[7.2553211,125.6792816],[7.2555944,125.679535],[7.256322,125.6803363],[7.2288686,125.6971945],[7.241773,125.7390441],[7.3054906,125.7191987],[7.3079954,125.7146537],[7.3120871,125.7145196],[7.3227765,125.7082271],[7.3238392,125.7076015],[7.3237768,125.6943226],[7.3258465,125.6918067],[7.3276027,125.6884646],[7.3275964,125.6836096],[7.3428152,125.6835871],[7.3426682,125.6728467],[7.3425211,125.6621063],[7.342374,125.651366],[7.3563229,125.6511715],[7.3562294,125.6386884],[7.3561358,125.6262052],[7.3560423,125.6137221],[7.3560251,125.6068059],[7.3560664,125.6061182],[7.3561093,125.6023671],[7.3560806,125.6001193],[7.356075,125.5955918],[7.3560827,125.5880454],[7.3560491,125.5849314],[7.3561145,125.5809966],[7.3560001,125.5719066],[7.3560495,125.5567306],[7.3766928,125.5567309],[7.3766926,125.5699217],[7.3751181,125.5699217],[7.3751174,125.6131053],[7.3889645,125.6139656],[7.3889525,125.616246],[7.3889393,125.6187433],[7.388934,125.6204545],[7.3888968,125.6208408],[7.3887904,125.6211626],[7.3885569,125.6215453],[7.388165,125.6220123],[7.3881131,125.6221876],[7.3881633,125.622305],[7.3881733,125.6225628],[7.3881398,125.6227096],[7.3880402,125.6229651],[7.3881148,125.6234211],[7.3881467,125.6242847],[7.3881467,125.6256527],[7.3881786,125.6275517],[7.3881786,125.6311941],[7.3882158,125.6377065],[7.3882265,125.6443477],[7.388191,125.6511504],[7.3883648,125.6507957],[7.3885058,125.6504524],[7.3891654,125.6490844],[7.3905247,125.646252],[7.3914465,125.6444382],[7.3921634,125.6429906],[7.392751,125.641821],[7.3938822,125.6395482],[7.394349,125.6385802],[7.3951516,125.6368858],[7.3958245,125.6355648],[7.3965028,125.6341486],[7.3968319,125.6334387],[7.397209,125.6325875],[7.3976426,125.6316689],[7.3986919,125.6297176],[7.3986879,125.6282893],[7.3986736,125.626209],[7.398648,125.6218117],[7.3986161,125.61921],[7.3985922,125.6166847],[7.3985941,125.6166017],[7.4040362,125.6169881],[7.4046508,125.6170309],[7.4052653,125.6170738],[7.4058799,125.6171166],[7.4062801,125.6171425],[7.4066803,125.6171684],[7.4070805,125.6171943],[7.4072474,125.6172051],[7.4074142,125.617216],[7.4093033,125.6173727],[7.4103939,125.6174397],[7.410995,125.6174666],[7.4143237,125.6177147],[7.4149301,125.6177643],[7.4178126,125.6179404],[7.419903,125.6180811],[7.4201123,125.6180952],[7.4221166,125.6182461],[7.4255137,125.6184849],[7.4326805,125.6189886],[7.4341103,125.6190857],[7.4344452,125.6191085],[7.4365696,125.6192529],[7.4380284,125.6193548],[7.4390683,125.6194232],[7.4408609,125.6195641],[7.4411907,125.6195842],[7.4416829,125.6196024],[7.4419939,125.619611],[7.4422625,125.6196204],[7.4426282,125.6196029],[7.4428516,125.6195842],[7.4430351,125.6195869],[7.4432147,125.6195962],[7.4452722,125.619786],[7.4467333,125.6199208],[7.4478556,125.6200173],[7.4496748,125.6201407],[7.4508997,125.6202204],[7.4508966,125.589001],[7.4499032,125.5889877],[7.4498543,125.5875541],[7.4495919,125.5836336],[7.4495658,125.5829574],[7.4497134,125.5822282],[7.4502407,125.5811011],[7.4505881,125.5802535],[7.4508424,125.57917],[7.4508955,125.5783224],[7.4508927,125.5499907],[7.4251886,125.5499899],[7.4255332,125.5503282],[7.4256822,125.5505052],[7.4257141,125.5506635],[7.4256636,125.5508271],[7.4255439,125.5509639],[7.4254053,125.5510258],[7.4252095,125.5510852],[7.4250033,125.5510802],[7.4246456,125.5510215],[7.4243488,125.551014],[7.4241533,125.5510714],[7.424089,125.5511961],[7.4240593,125.5513483],[7.424042,125.5515204],[7.4239629,125.5518871],[7.423901,125.5522438],[7.4237774,125.5527901],[7.4236277,125.5534008],[7.4233788,125.554381],[7.4233097,125.5545473],[7.4232538,125.5546063],[7.4231661,125.5546331],[7.4230623,125.554609],[7.4229161,125.5545071],[7.4227272,125.5543327],[7.4225011,125.5538714],[7.2211967,125.5499864]
                ]}
                pathOptions={{
                  color: '#dc2626',
                  weight: 2.5,
                  opacity: 0.85,
                  fillColor: 'transparent',
                  fillOpacity: 0.0,
                  dashArray: '6 4',
                }}
              />
              {liveRecords.map(({ record, position }) => (
                <CircleMarker
                  key={`record-${record.id}`}
                  center={position}
                  radius={9}
                  pathOptions={{
                    ...recordMarkerStyle,
                    fillColor: getRecordMarkerColor(record.survival_status),
                  }}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-foreground mb-2">{record.site_name}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><strong>Barangay:</strong> {record.barangay}</p>
                        <p><strong>Species:</strong> {record.species}</p>
                        <p><strong>Status:</strong> {record.survival_status}</p>
                        <p><strong>Monitoring:</strong> {formatPHDateShort(record.monitoring_date)}</p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {plantingAreas.map((area) => (
                <CircleMarker
                  key={area.id}
                  center={area.position}
                  radius={12}
                  pathOptions={{
                    ...markerStyle,
                    fillColor: getMarkerColor(area.healthStatus),
                  }}
                  eventHandlers={{
                    click: () => setSelectedArea(area),
                  }}
                  ref={(ref) => {
                    if (ref) circleRefs.current.set(area.id, ref);
                    else circleRefs.current.delete(area.id);
                  }}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-foreground mb-2">{area.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(area.healthStatus)}`}>
                            {area.healthStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{area.description}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p><strong>Species:</strong> {area.species}</p>
                          <p><strong>Total Plants:</strong> {area.totalPlants}</p>
                          <p><strong>Planted:</strong> {formatPHDateShort(area.plantedDate)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('monitoring');
                            setSelectedHistorySite(area.name);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                          style={{ background: 'linear-gradient(135deg, #1a7a4a 0%, #2d9e6b 100%)', boxShadow: '0 2px 8px rgba(26,122,74,0.35)' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Status
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            {showTileError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs text-muted-foreground">
                Map tiles are blocked on this network. Try another connection.
              </div>
            )}
          </div>
        </div>

        {/* Areas List */}
        <div className="space-y-4 self-start">

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-primary">{plantingAreas.length}</div>
              <div className="text-xs text-muted-foreground">Total Areas</div>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold">
                {plantingAreas.reduce((sum, area) => sum + area.totalPlants, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Plants</div>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {plantingAreas.filter(a => a.healthStatus === 'healthy').length}
              </div>
              <div className="text-xs text-muted-foreground">Healthy Areas</div>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {plantingAreas.filter(a => a.healthStatus === 'monitoring').length}
              </div>
              <div className="text-xs text-muted-foreground">At Risk Areas</div>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {plantingAreas.filter(a => a.healthStatus === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Dead/Critical Areas</div>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold">
                {new Set(plantingAreas.map(a => a.species)).size}
              </div>
              <div className="text-xs text-muted-foreground">Species</div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="mb-3">Planting Areas</h3>
            <div className="space-y-2">
              {plantingAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => {
                    setSelectedArea(area);
                    setFlyTarget({ area, key: Date.now() });
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedArea?.id === area.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{area.name}</div>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(area.healthStatus)}`}>
                      {area.healthStatus}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{area.species}</p>
                    <p>{area.totalPlants} plants • {formatPHDateShort(area.plantedDate)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Controls */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">🗺️ Layer Controls</h3>
            <div className="space-y-2">
              <button
                id="heatmap-toggle-btn"
                onClick={() => setShowHeatmap((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  showHeatmap
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  {/* Three-colour swatch matching actual heatmap tiers */}
                  <span className="inline-flex gap-0.5">
                    <span className="inline-block w-2 h-3 rounded-l-sm" style={{ background: '#15803d' }} />
                    <span className="inline-block w-2 h-3"             style={{ background: '#b45309' }} />
                    <span className="inline-block w-2 h-3 rounded-r-sm" style={{ background: '#991b1b' }} />
                  </span>
                  Plant Density Heatmap
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    showHeatmap ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {showHeatmap ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Live counts when heatmap is ON */}
              {showHeatmap && (
                <div className="space-y-1 pt-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Unique planting sites</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {heatmapData.healthy.length}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">sites<br/>surviving</span>
                    </div>
                    <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-amber-500/10 border border-amber-500/30">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {heatmapData.at_risk.length}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">sites<br/>at risk</span>
                    </div>
                    <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-red-500/10 border border-red-500/30">
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">
                        {heatmapData.dead.length}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">sites<br/>w/ dead</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-primary"></div>
                <span>Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-yellow-500"></div>
                <span>Monitoring Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-destructive"></div>
                <span>Critical Attention</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-blue-500"></div>
                <span>Live monitoring record</span>
              </div>

              {/* Heatmap legend — only visible when heatmap is ON */}
              {showHeatmap && (
                <div className="pt-2 border-t border-border mt-1 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Heatmap Colours</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-3 rounded-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(90deg,rgba(34,197,94,0.4),#15803d)' }}
                    />
                    <span className="text-xs">Surviving / Healthy seedlings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-3 rounded-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(90deg,rgba(234,179,8,0.4),#b45309)' }}
                    />
                    <span className="text-xs">At-risk seedlings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-3 rounded-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(90deg,rgba(239,68,68,0.4),#991b1b)' }}
                    />
                    <span className="text-xs">Dead / Not surviving</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pt-0.5">
                    Intensity = proportion of seedlings in that state per site
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2 text-primary">💡 Tip</h4>
            <p className="text-xs text-foreground">
              Click on any marker to view details. Live monitoring points refresh every 15 seconds.
              {showHeatmap && ' Heatmap colours reflect actual seedling survival counts per monitoring record.'}
            </p>
          </div>


          {/* Location Information Section */}
          {latestMonitoringRecords.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">📍 Location Information</h3>
              <p className="text-xs text-muted-foreground mb-3">Site details and GPS coordinates for the new planting location.</p>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const record = latestMonitoringRecords[0];
                  if (!record) return null;
                  return (
                    <>
                      <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">Site Name</span>
                        <p className="text-sm font-semibold text-foreground mt-1">{record.site_name}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">Barangay</span>
                        <p className="text-sm font-semibold text-foreground mt-1">{record.barangay}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">Latitude</span>
                        <p className="text-sm font-semibold text-foreground mt-1 font-mono">{record.latitude}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">Longitude</span>
                        <p className="text-sm font-semibold text-foreground mt-1 font-mono">{record.longitude}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}


      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">List of Monitoring Records</h2>
              <p className="text-sm text-muted-foreground">Showing {latestMonitoringRecords.length} of {latestMonitoringRecords.length} records</p>
            </div>
            <button
              onClick={fetchMonitoringRecords}
              disabled={isLoadingRecords}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isLoadingRecords ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {recordsError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Error loading records: {recordsError}</p>
            </div>
          )}

          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading monitoring records...</div>
            </div>
          ) : latestMonitoringRecords.length > 0 ? (
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Site Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Barangay</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Species</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Planting Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Growing</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">At Risk</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Dead</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">MR-{String(record.displayId).padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{record.site_name}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{record.barangay}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{record.species}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatPHDateShort(record.date_planted)}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                            {record.growing_count ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                            {record.at_risk_count ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600">
                            {record.dead_count ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeStyle(record.survival_status)}`}>
                            {getStatusLabel(record.survival_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedHistorySite(record.site_name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="View Records"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Record
                            </button>
                            <button
                              onClick={() => deleteRecord(record.id, true)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              title="Delete entire site history"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-border bg-secondary/20 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, latestMonitoringRecords.length)} of {latestMonitoringRecords.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-2 py-1 rounded border border-border transition-colors ${
                          page === currentPage ? 'bg-primary text-white border-primary' : 'hover:bg-secondary'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <svg className="size-16 mx-auto mb-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-semibold text-foreground mb-1">No Monitoring Records Yet</p>
              <p className="text-sm text-muted-foreground">Add monitoring records to see them appear in this table.</p>
            </div>
          )}
        </div>
      )}

      {selectedHistorySite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-card border border-border p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Monitoring Records: {selectedHistorySite}
                </h3>
                <p className="text-sm text-muted-foreground">All logged monitoring entries for this planting site. Click Edit to update a record.</p>
              </div>
              <button
                onClick={() => setSelectedHistorySite(null)}
                className="rounded-full border border-border bg-background p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              {monitoringRecords
                .filter(r => r.site_name === selectedHistorySite)
                .sort((a, b) => {
                  const dateDiff = new Date(b.monitoring_date).getTime() - new Date(a.monitoring_date).getTime();
                  if (dateDiff !== 0) return dateDiff;
                  return b.id - a.id;
                })
                .length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No logged records for this site.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-emerald-200 ml-4 space-y-6 py-2">
                  {monitoringRecords
                    .filter(r => r.site_name === selectedHistorySite)
                    .sort((a, b) => {
                      const dateDiff = new Date(b.monitoring_date).getTime() - new Date(a.monitoring_date).getTime();
                      if (dateDiff !== 0) return dateDiff;
                      return b.id - a.id;
                    })
                    .map((item, index) => (
                      <div key={item.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[31px] top-2 size-4 rounded-full border-2 border-white bg-primary shadow-sm"></div>

                        <div className="bg-secondary/20 rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
                          {/* Card header row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {formatPHDateShort(item.monitoring_date)}
                              </span>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(item.survival_status)}`}>
                                {getStatusLabel(item.survival_status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Edit Record button for any record in the timeline */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedHistorySite(null);
                                  openEditModal(item);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                                title="Edit this record"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>

                              {/* Remove Record button */}
                              <button
                                type="button"
                                onClick={() => {
                                  deleteRecord(item.id);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shrink-0"
                                title="Delete this record"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>

                              {/* Update Progress button ONLY for the latest/top record */}
                              {index === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHistorySite(null);
                                    openProgressModal(item);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
                                  title="Update Progress for this record"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Update Progress
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="block text-xs text-muted-foreground">Avg Tree Height</span>
                              <span className="font-semibold text-foreground">
                                {item.current_height_cm ? `${item.current_height_cm} cm` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground">Seedling Count</span>
                              <span className="font-semibold text-foreground">{item.number_seedlings.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground">Planting Date</span>
                              <span className="font-semibold text-foreground">{formatPHDateShort(item.date_planted)}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground">Monitoring Date</span>
                              <span className="font-semibold text-foreground">{formatPHDateShort(item.monitoring_date)}</span>
                            </div>
                          </div>

                          {(item.growing_count !== null || item.at_risk_count !== null || item.dead_count !== null) && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                                Growing: {item.growing_count ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-600">
                                At Risk: {item.at_risk_count ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-600">
                                Dead: {item.dead_count ?? 0}
                              </span>
                            </div>
                          )}

                          {item.remarks && (
                            <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2 bg-background/30 p-2 rounded-lg">
                              <span className="font-medium text-foreground block mb-1">Notes/Remarks:</span>
                              {item.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-card border border-border p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-foreground">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {isProgressMode ? 'Add Progress Update' : 'Edit Monitoring Record'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isProgressMode ? 'Log new monitoring progress parameters for this site.' : 'Modify details for this specific monitoring log.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-border bg-background p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={isProgressMode ? handleProgressSubmit : handleUpdateRecordSubmit}
              className="space-y-4 text-foreground"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Site Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isProgressMode}
                    value={editForm.site_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, site_name: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Barangay *</label>
                  <select
                    required
                    disabled={isProgressMode}
                    value={editForm.barangay}
                    onChange={(e) => setEditForm(prev => ({ ...prev, barangay: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    {barangayOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Species *</label>
                  <select
                    required
                    disabled={isProgressMode}
                    value={editForm.species}
                    onChange={(e) => setEditForm(prev => ({ ...prev, species: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    {speciesOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Planting Method</label>
                  <select
                    disabled={isProgressMode}
                    value={editForm.planting_method}
                    onChange={(e) => setEditForm(prev => ({ ...prev, planting_method: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-card text-foreground">None</option>
                    {plantingMethods.map((opt) => (
                      <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Number of Seedlings *</label>
                  <input
                    type="number"
                    required
                    disabled={isProgressMode}
                    min="1"
                    value={editForm.number_seedlings}
                    onChange={(e) => setEditForm(prev => ({ ...prev, number_seedlings: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Planting Date *</label>
                  <input
                    type="date"
                    required
                    disabled={isProgressMode}
                    value={editForm.date_planted}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date_planted: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-secondary/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Monitoring Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.monitoring_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, monitoring_date: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground">
                    Plant Condition Status
                    <span className="ml-2 text-xs font-normal text-muted-foreground/70">
                      (Total: {editForm.number_seedlings} seedlings — {Number(editForm.growing_count || 0) + Number(editForm.at_risk_count || 0)} active, {editForm.dead_count || 0} dead)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <label className="block text-xs font-semibold mb-1 text-emerald-400">Growing</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={editForm.number_seedlings}
                        value={editForm.growing_count}
                        onChange={(e) => handleGrowingCountChange(e.target.value)}
                        className="w-full rounded-lg border border-emerald-500/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                      <label className="block text-xs font-semibold mb-1 text-amber-400">At Risk</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={editForm.number_seedlings}
                        value={editForm.at_risk_count}
                        onChange={(e) => handleAtRiskCountChange(e.target.value)}
                        className="w-full rounded-lg border border-amber-500/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                      <label className="block text-xs font-semibold mb-1 text-red-400">Dead</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={editForm.number_seedlings}
                        value={editForm.dead_count}
                        onChange={(e) => handleDeadCountChange(e.target.value)}
                        className="w-full rounded-lg border border-red-500/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                      />
                    </div>
                  </div>
                  {(() => {
                    const total = parseInt(editForm.number_seedlings, 10) || 0;
                    const sum = (parseInt(editForm.growing_count, 10) || 0) + (parseInt(editForm.at_risk_count, 10) || 0) + (parseInt(editForm.dead_count, 10) || 0);
                    return sum !== total ? (
                      <p className="mt-2 text-xs text-red-400">⚠ Total is {sum} — must equal {total}</p>
                    ) : (
                      <p className="mt-2 text-xs text-emerald-400">✓ Counts match total seedlings</p>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Average Tree Height (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.current_height_cm}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_height_cm: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">Remarks</label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full h-20 rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-full border border-border bg-background py-2 px-5 text-sm font-semibold text-foreground hover:bg-secondary/20 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isUpdatingRecord ||
                    (isProgressMode
                      ? (
                          editForm.growing_count === String(editingRecord?.number_seedlings ?? '') &&
                          editForm.at_risk_count === '0' &&
                          editForm.dead_count === '0' &&
                          editForm.current_height_cm === '' &&
                          editForm.remarks === '' &&
                          editForm.monitoring_date === new Date().toISOString().slice(0, 10)
                        )
                      : (
                          editForm.site_name === (editingRecord?.site_name ?? '') &&
                          editForm.barangay === (editingRecord?.barangay ?? '') &&
                          editForm.species === (editingRecord?.species ?? '') &&
                          editForm.planting_method === (editingRecord?.planting_method ?? '') &&
                          editForm.number_seedlings === String(editingRecord?.number_seedlings ?? '') &&
                          editForm.date_planted === (editingRecord?.date_planted ?? '') &&
                          editForm.monitoring_date === (editingRecord?.monitoring_date ?? '') &&
                          editForm.current_height_cm === (editingRecord?.current_height_cm !== null ? String(editingRecord?.current_height_cm) : '') &&
                          editForm.growing_count === (editingRecord?.growing_count !== null ? String(editingRecord?.growing_count) : '') &&
                          editForm.at_risk_count === (editingRecord?.at_risk_count !== null ? String(editingRecord?.at_risk_count) : '') &&
                          editForm.dead_count === (editingRecord?.dead_count !== null ? String(editingRecord?.dead_count) : '') &&
                          editForm.remarks === (editingRecord?.remarks ?? '')
                        )
                    )
                  }
                  className="rounded-full bg-emerald-600 py-2 px-6 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingRecord ? 'Saving...' : (isProgressMode ? 'Add Update' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Reports</h2>
              <p className="text-sm text-muted-foreground">Generate and download reports from monitoring records.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={reportFilter}
                onChange={(event) => {
                  setReportFilter(event.target.value as ReportFilter);
                  setReportPage(1);
                }}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="All Reports">All Reports</option>
                <option value="Monitoring Summary">Monitoring Summary</option>
                <option value="Species Distribution">Species Distribution</option>
                <option value="Survival Rate">Survival Rate</option>
                <option value="Conservation Overview">Conservation Overview</option>
              </select>
              <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm">
                {formatDateRangeLabel()}
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || isLoadingRecords}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {isGeneratingReport ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value as ReportType)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="Monitoring Summary">Monitoring Summary</option>
                  <option value="Species Distribution">Species Distribution</option>
                  <option value="Survival Rate">Survival Rate</option>
                  <option value="Conservation Overview">Conservation Overview</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">File Format</label>
                <select
                  value={reportFormat}
                  onChange={(event) => setReportFormat(event.target.value as ReportFormat)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">From</label>
                <input
                  type="date"
                  value={reportFromDate}
                  onChange={(event) => setReportFromDate(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">To</label>
                <input
                  type="date"
                  value={reportToDate}
                  onChange={(event) => setReportToDate(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Report Name</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Date Generated</th>
                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No reports generated yet. Use the controls above to create one.
                      </td>
                    </tr>
                  ) : (
                    reportPageRows.map((report) => (
                      <tr key={report.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{report.title}</td>
                        <td className="px-5 py-4 text-muted-foreground">{report.description}</td>
                        <td className="px-5 py-4 text-muted-foreground">{report.generatedAt}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadReport(report)}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/50"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredReports.length > 0 && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                <span>
                  Showing {reportStartIndex + 1} to {Math.min(reportEndIndex, filteredReports.length)} of {filteredReports.length} reports
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                    disabled={reportPage === 1}
                    className="rounded-full border border-border px-3 py-2 text-xs transition hover:bg-secondary disabled:opacity-50"
                  >
                    ‹
                  </button>
                  {[...Array(reportTotalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setReportPage(page)}
                        className={`rounded-full border px-3 py-2 text-xs transition ${page === reportPage ? 'border-primary bg-primary text-white' : 'border-border hover:bg-secondary'}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setReportPage((prev) => Math.min(prev + 1, reportTotalPages))}
                    disabled={reportPage === reportTotalPages}
                    className="rounded-full border border-border px-3 py-2 text-xs transition hover:bg-secondary disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
