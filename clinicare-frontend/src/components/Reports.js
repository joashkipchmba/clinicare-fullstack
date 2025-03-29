import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Paper, Tabs, Tab,
  TextField, MenuItem, Select, FormControl, InputLabel,
  LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
  DateRange, Refresh, PictureAsPdf,
  InsertDriveFile, BarChart, ShowChart, PieChart
} from '@mui/icons-material';
import { ReportService } from '../utils/api';
import Chart from 'chart.js/auto';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'chartjs-plugin-datalabels';
import API from '../utils/api';
import { Alert } from '@mui/material';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [chartType, setChartType] = useState('bar');
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('monthly');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState(new Date());
  const chartRef = useRef(null);
  const reportRef = useRef(null);
  const chartInstance = useRef(null);

  const reportTypes = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'patients', label: 'Patient Statistics' },
    { value: 'appointments', label: 'Appointment Analysis' },
    { value: 'inventory', label: 'Inventory Status' },
    { value: 'financial', label: 'Financial Report' },
  ];

  const dateRanges = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
    { value: 'line', label: 'Line Chart', icon: <ShowChart /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChart /> },
  ];

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, startDate, endDate]);

  useEffect(() => {
    if (reportData && chartRef.current) {
      renderChart();
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reportData, chartType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        report_type: reportType,
        date_range: dateRange,
        ...(dateRange === 'custom' && {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
      };

      const data = await ReportService.get(params);
      setReportData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    const config = {
      type: chartType,
      data: {
        labels: reportData.labels,
        datasets: reportData.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: getDatasetColors(dataset.label, reportData.datasets.length),
          borderColor: '#fff',
          borderWidth: chartType === 'pie' ? 0 : 1,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: reportData.title,
            font: {
              size: 16
            }
          },
          datalabels: {
            display: chartType === 'pie',
            formatter: (value) => {
              return value > 5 ? `${value}%` : '';
            },
            color: '#fff',
            font: {
              weight: 'bold'
            }
          }
        },
        scales: chartType !== 'pie' ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return reportType === 'financial' ? `$${value}` : value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        } : {}
      },
      plugins: [chartType === 'pie' ? 'chartjs-plugin-datalabels' : '']
    };

    chartInstance.current = new Chart(ctx, config);
  };

  const getDatasetColors = (label, count) => {
    const colorSchemes = {
      summary: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'],
      patients: ['#8cd17d', '#499894', '#e15759', '#f1ce63', '#86bcb6'],
      appointments: ['#ff9da7', '#9c755f', '#bab0ac', '#79706e', '#d37295'],
      inventory: ['#b07aa1', '#d4a6c8', '#f1ce63', '#86bcb6', '#ff9d9a'],
      financial: ['#59a14f', '#f1ce63', '#b6992d', '#8cd17d', '#86bcb6']
    };

    const index = reportData.labels.indexOf(label);
    return colorSchemes[reportType][index % colorSchemes[reportType].length];
  };

  const exportToPDF = () => {
    html2canvas(reportRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportType}_report_${new Date().toISOString().slice(0,10)}.pdf`);
    });
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    csvContent += reportData.labels.join(",") + "\n";

    // Add data
    reportData.datasets.forEach(dataset => {
      csvContent += dataset.label + ",";
      csvContent += dataset.data.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }} ref={reportRef}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4">Clinic Reports</Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchReportData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export to PDF">
            <IconButton onClick={exportToPDF} color="primary">
              <PictureAsPdf />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} color="primary">
              <InsertDriveFile />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              label="Report Type"
            >
              {reportTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              {dateRanges.map(range => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {dateRange === 'custom' && (
            <>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={startDate}
              />
            </>
          )}
        </Box>

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Visualization" icon={<BarChart />} />
          <Tab label="Data Table" icon={<InsertDriveFile />} />
          <Tab label="Insights" icon={<ShowChart />} />
        </Tabs>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : reportData ? (
        <>
          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5">{reportData.title}</Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {chartTypes.map(type => (
                    <Tooltip key={type.value} title={type.label}>
                      <IconButton
                        color={chartType === type.value ? 'primary' : 'default'}
                        onClick={() => setChartType(type.value)}
                      >
                        {type.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              <Box sx={{ height: '500px', position: 'relative' }}>
                <canvas ref={chartRef} />
              </Box>
            </Paper>
          )}

          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>{reportData.title} - Data</Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      {reportData.labels.map(label => (
                        <TableCell key={label} align="right">{label}</TableCell>
                      ))}
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.datasets.map(dataset => (
                      <TableRow key={dataset.label}>
                        <TableCell>{dataset.label}</TableCell>
                        {dataset.data.map((value, index) => (
                          <TableCell key={index} align="right">
                            {reportType === 'financial' ? `$${value.toFixed(2)}` : value}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          {reportType === 'financial' ?
                            `$${dataset.data.reduce((a, b) => a + b, 0).toFixed(2)}` :
                            dataset.data.reduce((a, b) => a + b, 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Key Insights</Typography>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 3
              }}>
                {reportData.insights?.map((insight, index) => (
                  <Paper key={index} sx={{ p: 2, height: '100%' }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        bgcolor: getDatasetColors(insight.title, 5),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        mr: 2
                      }}>
                        {index + 1}
                      </Box>
                      <Typography variant="h6">{insight.title}</Typography>
                    </Box>
                    <Typography>{insight.description}</Typography>
                    {insight.value && (
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {reportType === 'financial' ? `$${insight.value}` : insight.value}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Select report parameters to generate data</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Reports;