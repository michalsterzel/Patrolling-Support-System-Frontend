import { AppBar, Box, Card, CardContent, Container, CssBaseline, Grid, IconButton, Paper, ThemeProvider, Toolbar, Typography, createTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import * as React from 'react';
import { auth } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs, getFirestore, query, } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment/moment.js";


const theme = createTheme({
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

export function ViewTask() {

  const navigate = useNavigate();

  const handleReturnClick = () => {
    navigate("/home")
  }

  const handleTaskClick = (taskId) => {
    navigate(`/viewTasks/${taskId}`)
  }

  React.useEffect(() => {
    getTasksFromFirestore();
  }, []);

  const [tasks, setTasks] = React.useState([]);

  const getNameFromFirestore = async (coordinatorId) => {
    const database = getFirestore();
    const coordinatorRef = doc(database, "Coordinators", coordinatorId)
    const coordinatorSnapshot = await getDoc(coordinatorRef);

    if (coordinatorSnapshot.exists()) {
      const coordinatorName = coordinatorSnapshot.data().name + " " + coordinatorSnapshot.data().surname;
      return coordinatorName;
    } else {
      console.log("No such document!");
    }
  }

  const appendCoordinatorNameFromFirestore = async (taskList) => {
    const processedTaskList = await Promise.all(
      taskList.map(async (task) => {
        const queriedData = await getNameFromFirestore(task.coordinator);
        const updatedTask = { ...task, coordinatorName: queriedData };
        return updatedTask;
      })
    )

    setTasks(processedTaskList);
  }

  const getTasksFromFirestore = async () => {

    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (user) {
      const database = getFirestore();
      const q = query(collection(database, 'Tasks'));
      const querySnapshot = await getDocs(q);
      const fetchedTasks = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTasks.push({
          id: doc.id,
          name: data.name,
          coordinator: data.coordinator,
          location: data.location,
          startDate: data.startDate.toDate(),
        });
      });
      appendCoordinatorNameFromFirestore(fetchedTasks)
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="absolute"
        color="primary"
        elevation={0}
        sx={{
          position: 'relative',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton onClick={() => handleReturnClick()}>
            <ArrowBackIosIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
          <Typography component="h1" variant="h4" align="center">
            All tasks:
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <React.Fragment>
              <div style={{ height: "600px", overflowY: "scroll" }}>
                <Grid container spacing={2} alignItems="center">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <Grid item key={task.id} xs={12} sm={12}>
                        <Card onClick={() => handleTaskClick(task.id)}>
                          <CardContent>
                            <Typography variant="h6">{task.name}</Typography>
                            <Typography variant="body1">{task.location}</Typography>
                            <Typography variant="body1">Task coordinator: {task.coordinatorName}</Typography>
                            <Typography variant="body2">Start date: {moment(task.startDate).format('DD/MM/YYYY HH:mm')}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <p>Loading...</p>
                  )}
                </Grid>
              </div>
            </React.Fragment>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}