import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config.js";
import { collection, getDocs, getFirestore, where } from 'firebase/firestore';
import { query } from 'firebase/database';
import { ListItem } from '@mui/material';
import moment from 'moment';



const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

const mdTheme = createTheme({
  palette: {
    primary: {
      main: "#A9AC5D"
    },
    secondary: {
      main: "#E8E1DB"
    },
    tertiary: {
      default: "#3A3C26"
    },
    background: {
      default: "#E8E1DB"
    },
  },
});


function HomeContent() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const [isLoaded, setIsLoaded] = React.useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/", { replace: true })
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleNewTaskClick = () => {
    navigate("/createTask");
  }

  const handleViewTaskClick = () => {
    navigate("/viewTasks");
  }

  const handleAccountSettingsClick = () => {
    navigate("/AccountSettings");
  }

  const handleLogOut = () => {
    signOut(auth).then(() =>
      navigate("/"));
  }

  const [ongoingTasks, setOngoingTasks] = React.useState([]);

  const [upcomingTasks, setUpcomingTasks] = React.useState([]);

  const [finishedTasks, setFinishedTasks] = React.useState([]);

  const getAndSortTasks = async () => {
    const currentUser = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user.uid);
      });
    });
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, 'Tasks');
      const documentQuery = query(collectionRef, where("coordinator", '==', currentUser));
      const querySnapshot = await getDocs(documentQuery)
      const taskList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = {
          id: doc.id,
          name: data.name,
          location: data.location,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate()
        };
        taskList.push(task);
      });
      const currentTasks = taskList.filter(task => Date.now() >= task.startDate && Date.now() <= task.endDate);
      setOngoingTasks(currentTasks);
      const futureTasks = taskList.filter(task => Date.now() < task.startDate);
      setUpcomingTasks(futureTasks);
      const pastTasks = taskList.filter(task => Date.now() > task.endDate);
      setFinishedTasks(pastTasks)

      setIsLoaded(true)
    }
  }

  const handleTaskButtonClick = (taskId) => {
    navigate(`/viewTasks/${taskId}`);
  }

  React.useEffect(() => {
    getAndSortTasks()
  }, []);

  const mainListItems = (
    <React.Fragment>
      <ListItemButton onClick={() => handleNewTaskClick()}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText primary="Add new task" />
      </ListItemButton>
      <ListItemButton onClick={() => handleViewTaskClick()}>
        <ListItemIcon>
          <ListAltIcon />
        </ListItemIcon>
        <ListItemText primary="View all tasks" />
      </ListItemButton>
      <ListItemButton onClick={() => handleAccountSettingsClick()}>
        <ListItemIcon>
          <AccountBoxIcon />
        </ListItemIcon>
        <ListItemText primary="Account Settings" />
      </ListItemButton>
    </React.Fragment>
  );


  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px',
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Patrolling Support System Home Page
            </Typography>
            <IconButton color="inherit" onClick={() => handleLogOut()}>
              {/* To do: Uniemozliwić cofanie po wylogowaniu lub wymagać stanu zalogowania przy każdej nawigacji */}
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1, marginRight: '4px' }}
              >
                Sign Out
              </Typography>
              <Badge>
                <ExitToAppIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {mainListItems}
            <Divider sx={{ my: 1 }} />
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Tutaj idzie zawartośc strony */}
            {isLoaded ? (
              <Grid container spacing={3}>
                <Grid item xs={4} md={4} lg={4}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: 750,
                    }}
                  >
                    <Typography variant="h6">
                      Ongoing tasks:
                    </Typography>
                    <Divider orientation='horizontal' />
                    <List sx={{ overflow: 'auto', maxHeight: 750 }}>
                      {ongoingTasks.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem button onClick={() => handleTaskButtonClick(item.id)} sx={{ height: 'fit-content', py: 2 }}>
                            <ListItemText>
                              <Typography variant="h6" noWrap>{item.name}</Typography>
                              <Typography variant="body1" noWrap>{item.location}</Typography>
                              <Typography variant="body2" noWrap>Start date: {moment(item.startDate).format('DD/MM/YYYY HH:mm')}</Typography>
                            </ListItemText>
                          </ListItem>
                          <Divider orientation='horizontal' />
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={4} md={4} lg={4}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: 750,
                    }}
                  >
                    <Typography variant="h6">
                      Upcoming tasks:
                    </Typography>
                    <Divider orientation='horizontal' />
                    <List sx={{ overflow: 'auto', maxHeight: 750 }}>
                      {upcomingTasks.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem button onClick={() => handleTaskButtonClick(item.id)} sx={{ height: 'fit-content', py: 2 }}>
                            <ListItemText>
                              <Typography variant="h6" noWrap>{item.name}</Typography>
                              <Typography variant="body1" noWrap>{item.location}</Typography>
                              <Typography variant="body2" noWrap>Start date: {moment(item.startDate).format('DD/MM/YYYY HH:mm')}</Typography>
                            </ListItemText>
                          </ListItem>
                          <Divider orientation='horizontal' />
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={4} md={4} lg={4}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: 750,
                    }}>
                    <Typography variant="h6">
                      Completed tasks:
                    </Typography>
                    <Divider orientation='horizontal' />
                    <List sx={{ overflow: 'auto', maxHeight: 750 }}>
                      {finishedTasks.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem button onClick={() => handleTaskButtonClick(item.id)} sx={{ height: 'fit-content', py: 2 }}>
                            <ListItemText>
                              <Typography variant="h6" noWrap>{item.name}</Typography>
                              <Typography variant="body1" noWrap>{item.location}</Typography>
                              <Typography variant="body2" noWrap>Start date: {moment(item.startDate).format('DD/MM/YYYY HH:mm')}</Typography>
                            </ListItemText>
                          </ListItem>
                          <Divider orientation='horizontal' />
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography>
                Loading...
              </Typography>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export function Home() {
  return <HomeContent />;
}