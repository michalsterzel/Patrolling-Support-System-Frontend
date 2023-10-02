import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import IconButton from '@mui/material/IconButton';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "../firebase-config.js";
import { AddParticipantsForm } from '../Forms/AddParticipantsForm.js';
import { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers';
import 'dayjs/locale/pl';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { addDoc, collection, doc, documentId, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore'
import moment from 'moment';
import { Menu } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { Select } from '@mui/material';

const steps = ['Edit task details', 'Edit participants', 'Review changes'];

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

export function EditTaskComponent() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = useState({});
  const { taskId } = useParams();
  const [isLoaded, setIsLoaded] = React.useState(false);

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      updateFirebaseDocument(taskName, locationName, selectedParticipants, startDate, endDate, taskDescription)
    }
    if (activeStep === steps.length - 2) {
      getNamesFromFirestore(selectedParticipants);
    }
    if (activeStep === steps.length - 3) {
      handleCoordinatorListChange(coordinatorList);
    }
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const [documentData, setDocumentData] = React.useState(null);

  const getDocumentDetails = async () => {
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (user) {
      const database = getFirestore();
      const docRef = doc(database, 'Tasks', `${taskId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocumentData(data);
        setTaskName(data.name);
        setLocationName(data.location);
        setCurrentStartDate(moment(data.startDate.toDate()).format('DD/MM/YYYY HH:mm'));
        setStartDate(data.startDate.toDate());
        setCurrentEndDate(moment(data.endDate.toDate()).format('DD/MM/YYYY HH:mm'));
        setEndDate(data.endDate.toDate());
        setTaskDescription(data.taskDescription);
        handleCurrentSelectionChange(data.patrolParticipants)
        getCoordinatorsFromFirestore(data.coordinator);
      } else {
        console.log("No such document!");

      }
    };
  }

  const updateFirebaseDocument = async (
    taskName,
    locationName,
    selectedParticipants,
    startDate,
    endDate,
    taskDescription) => {
    if (auth.currentUser) {
      const database = getFirestore();


      // Przerobić tak żeby nie wypierdalało checkpointów
      const docRef = doc(database, 'Tasks', taskId);
      updateDoc(docRef, {
        name: taskName,
        location: locationName,
        coordinator: selectedCoordinator,
        patrolParticipants: selectedParticipants,
        startDate: startDate,
        endDate: endDate,
        taskDescription: taskDescription,
      }).then(docRef => {
        console.log(`Document with id: ${taskId} has been updated successfully`)
      }).catch(error => {
        console.log(error);
      });
    }
  }

  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/", { replace: true })
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleReturnClick = () => {
    navigate(`/viewTasks/${taskId}`);
  }

  const [userRole, setUserRole] = useState('');
  const handleUserRoleChange = (newRole) => {
    setUserRole(newRole);
  };

  const [taskName, setTaskName] = useState('');
  const handleTaskNameChange = (event) => {
    setTaskName(event.target.value);
  };

  const [locationName, setLocationName] = useState('');
  const handleLocationNameChange = (event) => {
    setLocationName(event.target.value);
  };

  const [taskStartDate, setTaskStartDate] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const handleTaskStartDateChange = (newDate) => {
    const selectedStartDate = newDate.toDate();
    setTaskStartDate(newDate);
    setStartDate(selectedStartDate);
  };
  const [currentStartDate, setCurrentStartDate] = useState(null);
  const handleCurrentStartDateChange = (newDate) => {
    setCurrentStartDate(newDate);
  };
  const [taskEndDate, setTaskEndDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date())
  const handleTaskEndDateChange = (newDate) => {
    const selectedEndDate = newDate.toDate()
    setTaskEndDate(newDate);
    setEndDate(selectedEndDate);
  };
  const [currentEndDate, setCurrentEndDate] = useState(null);
  const handleCurrentEndDateChange = (newDate) => {
    setCurrentEndDate(newDate);
  };

  const [taskDescription, setTaskDescription] = useState('');
  const handleTaskDescriptionChange = (event) => {
    setTaskDescription(event.target.value);
  };

  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const handleSelectedParticipantsChange = (newSelectedParticipants) => {
    setSelectedParticipants(newSelectedParticipants);
  };

  const [participantList, setParticipantList] = useState([]);
  const getNamesFromFirestore = async (selectedParticipants) => {
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, 'Users');
      const documentQuery = query(collectionRef, where(documentId(), 'in', selectedParticipants));
      const querySnapshot = await getDocs(documentQuery)
      const participantsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const participant = {
          id: doc.id,
          name: data.name,
          surname: data.surname
        };
        participantsData.push(participant);
      });
      setParticipantList(participantsData);
    }
  }

  const [currentSelection, setCurrentSelection] = useState([]);
  const handleCurrentSelectionChange = (newSelection) => {
    setCurrentSelection(newSelection);
  };

  // -------------------------------------------------------------------------------------------------------------------

  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const handleCoordinatorChange = (newCoordinatorId, coordinatorList) => {
    setSelectedCoordinator(newCoordinatorId)
    const currentCoordinator = coordinatorList.find(coordinator => coordinator.id === newCoordinatorId);
    handleCoordinatorNameChange(currentCoordinator.name + ' ' + currentCoordinator.surname)
  };

  const [selectedCoordinatorName, setSelectedCoordinatorName] = useState('');
  const handleCoordinatorNameChange = (newCoordinatorName) => {
    setSelectedCoordinatorName(newCoordinatorName)
  };

  const [coordinatorList, setCoordinatorList] = useState([]);
  const handleCoordinatorListChange = (newData) => {
    setCoordinatorList(newData)
  };

  const getCoordinatorsFromFirestore = async (coordinatorId) => {
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, 'Coordinators');
      const querySnapshot = await getDocs(collectionRef)
      const coordinatorsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const coordinator = {
          id: data.userId,
          name: data.name,
          surname: data.surname,
          role: data.role
        };
        coordinatorsData.push(coordinator);
      });
      handleCoordinatorListChange(coordinatorsData);
      handleCoordinatorChange(coordinatorId, coordinatorsData);

      const currentUserData = coordinatorsData.find(coordinator => coordinator.id === auth.currentUser.uid);
      handleUserRoleChange(currentUserData.role)
    }
  }

  React.useEffect(() => {
    getDocumentDetails();
  }, [])

  React.useEffect(() => {
    setIsLoaded(true);
  }, [documentData, coordinatorList])

  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <React.Fragment>
            <Typography variant="h6" gutterBottom>
              Edit task details:
            </Typography>
            {isLoaded ? (
              <Grid container spacing={4}>
                <Grid item xs={12} sm={10}>
                  <TextField
                    required
                    id="taskName"
                    name="taskName"
                    label="Task name"
                    fullWidth
                    variant="standard"
                    value={taskName}
                    onChange={handleTaskNameChange}
                  />
                </Grid>
                <Grid item xs={12} sm={10}>
                  <TextField
                    required
                    id="locationName"
                    name="locationName"
                    label="Location name"
                    fullWidth
                    variant="standard"
                    value={locationName}
                    onChange={handleLocationNameChange}
                  />
                </Grid>
                <Grid item xs={12} sm={10}>
                  <Typography>
                    Task coordinator:
                  </Typography>
                  <Select
                    labelId="coordinator-label"
                    id="coordinator-select"
                    value={selectedCoordinator}
                    label="Select coordinator"
                    onChange={(event) => handleCoordinatorChange(event.target.value, coordinatorList)}
                    sx={{ width: '60%' }}
                    disabled={userRole !== 'coordinatorAdmin'}
                  >
                    {coordinatorList.map((coordinator) => (
                      <MenuItem key={coordinator.id} value={coordinator.id}>
                        {`${coordinator.name} ${coordinator.surname}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={10} style={{ marginTop: '20px' }}>
                  <Typography>
                    Task start date:
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <MobileDateTimePicker
                      required
                      label={currentStartDate}
                      slotProps={{ textField: { size: 'small' } }}
                      ampm={false}
                      openTo="year"
                      format='DD/MM/YYYY HH:mm'
                      onChange={handleTaskStartDateChange}
                      value={taskStartDate}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={10}>
                  <Typography>
                    Task end date:
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <MobileDateTimePicker
                      required
                      label={currentEndDate}
                      slotProps={{ textField: { size: 'small' } }}
                      ampm={false}
                      format='DD/MM/YYYY HH:mm'
                      onChange={handleTaskEndDateChange}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    variant='outlined'
                    label='Task description'
                    fullWidth
                    multiline
                    value={taskDescription}
                    onChange={handleTaskDescriptionChange}
                  />
                </Grid>
              </Grid>
            ) : (
              <Typography>
                Loading...
              </Typography>
            )}
          </React.Fragment>
        );
      case 1:
        return <AddParticipantsForm
          selectedRows={selectedParticipants}
          handleSelectedRowsChange={handleSelectedParticipantsChange}
          currentSelection={currentSelection}
        />;
      case 2:
        return (
          <React.Fragment>
            <Typography variant="h6" gutterBottom>
              Review changes:
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Task name:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  fullWidth
                  multiline
                  rows={1}
                  value={taskName}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Location name:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  fullWidth
                  multiline
                  rows={1}
                  value={locationName}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Coordinator:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  fullWidth
                  multiline
                  rows={1}
                  value={selectedCoordinatorName}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Task Participants:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  fullWidth
                  multiline
                  rows={2}
                  value={participantList.map(participant => participant.name + ' ' + participant.surname).join(', ')}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Task start date:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  rows={1}
                  value={moment(startDate).format('DD/MM/YYYY HH:mm')}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10} >
                <Typography>
                  Task end date:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  rows={1}
                  value={moment(endDate).format('DD/MM/YYYY HH:mm')}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography>
                  Task description:
                </Typography>
                <TextField
                  variant='outlined'
                  margin="normal"
                  fullWidth
                  multiline
                  rows={4}
                  value={taskDescription}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000000",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </React.Fragment>
        );
      default:
        throw new Error('Unknown step');
    }
  }

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
            Edit patrolling task
          </Typography>
          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {activeStep === steps.length ? (
            <React.Fragment>
              <Typography variant="h5" gutterBottom>
                Task successfully updated
              </Typography>
              <Typography variant="subtitle1"></Typography>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {getStepContent(activeStep)}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                    Back
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 3, ml: 1 }}
                >
                  {activeStep === steps.length - 1 ? 'Update task' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}