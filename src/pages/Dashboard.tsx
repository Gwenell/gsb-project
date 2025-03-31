import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CustomGrid from '../components/CustomGrid';

// Counter component for animated number display
const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const totalFrames = Math.round(60 * duration);
    const increment = end / totalFrames;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000/60);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <>{count}</>;
};

// Define types for our state
interface ChartDataItem {
  name: string;
  count: number;
}

interface DashboardStats {
  totalReports: number;
  totalDoctors: number;
  totalMedications: number;
  recentReports: number;
  reportsByMonth: ChartDataItem[];
  reportsByDoctor: ChartDataItem[];
  topMedications: ChartDataItem[];
}

const crimsonRed = '#DC143C';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalDoctors: 0,
    totalMedications: 0,
    recentReports: 0,
    reportsByMonth: [],
    reportsByDoctor: [],
    topMedications: [],
  });
  
  const theme = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';

  // Données simulées pour les rapports par mois
  const monthlyReports = [
    { name: 'Jan', count: 65 },
    { name: 'Fév', count: 59 },
    { name: 'Mar', count: 80 },
    { name: 'Avr', count: 81 },
    { name: 'Mai', count: 56 },
    { name: 'Juin', count: 55 },
    { name: 'Juil', count: 40 },
  ];

  // Données simulées pour les médecins les plus visités
  const topDoctors = [
    { name: 'Dr. Dupont', count: 12 },
    { name: 'Dr. Martin', count: 9 },
    { name: 'Dr. Durand', count: 7 },
    { name: 'Dr. Petit', count: 6 },
    { name: 'Dr. Simon', count: 4 }
  ];

  // Données simulées pour les médicaments les plus offerts
  const topMeds = [
    { name: 'Doliprane', count: 18 },
    { name: 'Efferalgan', count: 15 },
    { name: 'Advil', count: 12 },
    { name: 'Spasfon', count: 9 },
    { name: 'Smecta', count: 7 }
  ];

  // Couleurs pour les graphiques
  const COLORS = ['#1976d2', '#dc004e', '#4caf50', '#ff9800', '#9c27b0'];

  useEffect(() => {
    // Simulation du chargement des données
    const timer = setTimeout(() => {
      setStats({
        totalReports: 187,
        totalDoctors: 32,
        totalMedications: 83,
        recentReports: 14,
        reportsByMonth: monthlyReports,
        reportsByDoctor: topDoctors,
        topMedications: topMeds,
      });
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [monthlyReports, topDoctors, topMeds]);

  if (isLoading) {
    return (
      <Layout title="Tableau de bord">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  // Card variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }
    })
  };
  
  // Chart variants
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.2 + 0.4,
        duration: 0.6,
        type: 'spring',
        stiffness: 80
      }
    })
  };

  // Define card items
  const statCards = [
    { 
      title: 'Rapports de visite', 
      value: 1593, 
      color: crimsonRed,
      icon: <AssignmentIcon color="error" />
    },
    { 
      title: 'Médecins', 
      value: 1000, 
      color: theme.palette.secondary.main,
      icon: <LocalHospitalIcon style={{ color: '#777777' }} />
    },
    { 
      title: 'Médicaments', 
      value: 28, 
      color: '#4caf50',
      icon: <MedicationIcon style={{ color: '#4caf50' }} />
    },
    { 
      title: 'Rapports récents', 
      value: 14, 
      color: '#2196f3',
      icon: <DateRangeIcon style={{ color: '#2196f3' }} />
    }
  ];

  // Définition des gradients de couleurs pour les charts
  const getGradientDef = (id: string, color1: string, color2: string) => (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color1} stopOpacity={0.8}/>
        <stop offset="95%" stopColor={color2} stopOpacity={0.8}/>
      </linearGradient>
    </defs>
  );

  // Style des tooltips
  const customTooltipStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px'
  };

  // Personnaliser le tooltip pour l'affichage des médicaments
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={customTooltipStyle}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: payload[0].color }}>
            {`${payload[0].name}: ${payload[0].value} présentations`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout title="Tableau de bord">
      <CustomGrid container spacing={3}>
        {/* Stat Cards */}
        {statCards.map((card, index) => (
          <CustomGrid item xs={12} sm={6} md={3} key={card.title}>
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #eaeaea',
                  borderLeft: `4px solid ${card.color}`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'medium' }}>
                    {card.title}
                  </Typography>
                  <Box>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  <Counter value={card.value} />
                </Typography>
              </Paper>
            </motion.div>
          </CustomGrid>
        ))}

        {/* Charts row 1 */}
        <CustomGrid item xs={12} md={8}>
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
          >
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: '1px solid #eaeaea', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Rapports par mois
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyReports}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value} rapports`, 'Nombre']}
                      labelStyle={{ color: theme.palette.text.primary }}
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Rapports"
                      stroke="#777777"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </CustomGrid>

        <CustomGrid item xs={12} md={4}>
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                height: '100%', 
                border: '1px solid #eaeaea', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: `linear-gradient(90deg, ${crimsonRed}, #ff6b6b)`
                }
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <MedicationIcon sx={{ fontSize: 20, mr: 1, color: crimsonRed }} />
                Médicaments les plus présentés
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topMeds}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    {getGradientDef('medicamentGradient', crimsonRed, '#ff6b6b')}
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" horizontal={false} />
                    <XAxis 
                      type="number" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={90}
                      axisLine={false}
                      tickLine={false} 
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      name="Présentations" 
                      barSize={20}
                      radius={[0, 8, 8, 0]}
                      fill="url(#medicamentGradient)"
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </CustomGrid>

        {/* Charts row 2 */}
        <CustomGrid item xs={12}>
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                border: '1px solid #eaeaea', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: `linear-gradient(90deg, #4CAF50, #8BC34A)`
                }
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                <LocalHospitalIcon sx={{ fontSize: 20, mr: 1, color: '#4CAF50' }} />
                Médecins les plus visités
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDoctors}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    {getGradientDef('doctorsGradient', '#4CAF50', '#8BC34A')}
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      axisLine={false}
                      tickLine={false}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} visites`, 'Nombre']}
                      labelStyle={{ fontWeight: 'bold' }}
                      contentStyle={customTooltipStyle}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#doctorsGradient)" 
                      name="Visites" 
                      barSize={26}
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease"
                    >
                      {topDoctors.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fillOpacity={1 - index * 0.15}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </CustomGrid>
      </CustomGrid>
    </Layout>
  );
};

export default Dashboard; 