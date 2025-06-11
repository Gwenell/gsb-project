import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  useTheme,
  Alert,
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
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CustomGrid from '../components/CustomGrid';
import { getAllMedecins, getAllMedicaments, getPublicDashboardStats } from '../services/api';
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  currentMonth: string;
}

const crimsonRed = '#DC143C';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalDoctors: 0,
    totalMedications: 0,
    recentReports: 0,
    reportsByMonth: [],
    reportsByDoctor: [],
    currentMonth: ''
  });
  
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get public dashboard stats (available to all users)
        const statsResponse = await getPublicDashboardStats();
        
        console.log("Statistiques publiques brutes:", statsResponse);
        
        // Current month
        const currentDate = new Date();
        const currentMonth = format(currentDate, 'MMM', { locale: fr });
        
        // Check if current month has reports
        const currentMonthData = statsResponse.data.rapports_by_month?.find((m: any) => m.name === currentMonth);
        if (currentMonthData && currentMonthData.count === 0) {
          setError(`Aucun rapport pour ${currentMonth}. Affichage des mois précédents.`);
        }
        
        setStats({
          totalReports: statsResponse.data.total_rapports || 0,
          totalDoctors: statsResponse.data.total_medecins || 0,
          totalMedications: statsResponse.data.total_medicaments || 0,
          recentReports: statsResponse.data.recent_rapports || 0,
          reportsByMonth: statsResponse.data.rapports_by_month || [],
          reportsByDoctor: statsResponse.data.top_doctors || [],
          currentMonth
        });
      } catch (err) {
        console.error('Erreur lors de la récupération des données du dashboard:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
      value: stats.totalReports, 
      color: crimsonRed,
      icon: <AssignmentIcon color="error" />
    },
    { 
      title: 'Médecins', 
      value: stats.totalDoctors, 
      color: theme.palette.secondary.main,
      icon: <LocalHospitalIcon style={{ color: '#777777' }} />
    },
    { 
      title: 'Médicaments', 
      value: stats.totalMedications, 
      color: '#4caf50',
      icon: <MedicationIcon style={{ color: '#4caf50' }} />
    },
    { 
      title: 'Rapports récents', 
      value: stats.recentReports, 
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
        <CustomGrid item xs={12}>
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
          >
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: '1px solid #eaeaea', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Rapports par mois
                {error && error.includes('Aucun rapport pour') && (
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: 'inline-block' }}>
                    ({error})
                  </Typography>
                )}
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.reportsByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 'auto']} />
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
                    data={stats.reportsByDoctor}
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
                      {stats.reportsByDoctor.map((entry, index) => (
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