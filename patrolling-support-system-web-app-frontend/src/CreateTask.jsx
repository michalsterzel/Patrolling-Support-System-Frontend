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
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "./firebase-config.js";
import { AddParticipantsForm } from './Forms/AddParticipantsForm.js';
import { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers';
import 'dayjs/locale/pl';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { addDoc, collection, doc, documentId, getDoc, getDocs, getFirestore, query, Timestamp, where } from 'firebase/firestore'


const steps = ['Enter task details', 'Choose participants', 'Review task'];


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

export function CreateTask() {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      createFirebaseDocument(taskName, locationName, selectedParticipants, startDate, endDate, taskDescription)
    }
    if (activeStep === steps.length - 2) {
      getNamesFromFirestore(selectedParticipants);
    }
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };



  const createFirebaseDocument = async (
    taskName,
    locationName,
    selectedParticipants,
    startDate,
    endDate,
    taskDescription) => {
    if (auth.currentUser) {
      const database = getFirestore();

      const docRef = await addDoc(collection(database, 'Tasks'), {
        name: taskName,
        location: locationName,
        patrolParticipants: selectedParticipants,
        startDate: startDate,
        endDate: endDate,
        taskDescription: taskDescription,
        coordinator: auth.currentUser.uid,
        checkpoints: [],
        checkpointNames: []
      });
      console.log("Added new document with ID: ", docRef.id)
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
    navigate("/home")
  }

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

  const [taskEndDate, setTaskEndDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date())
  const handleTaskEndDateChange = (newDate) => {
    const selectedEndDate = newDate.toDate()
    setTaskEndDate(newDate);
    setEndDate(selectedEndDate);
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

  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <React.Fragment>
            <Typography variant="h6" gutterBottom>
              Enter task details:
            </Typography>
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileDateTimePicker
                    required
                    label='Task start time *'
                    slotProps={{ textField: { size: 'small' } }}
                    ampm={false}
                    openTo="year"
                    format='DD/MM/YYYY HH:mm'
                    onChange={handleTaskStartDateChange}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={10}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileDateTimePicker
                    required
                    label='Task end time *'
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
          </React.Fragment>
        );
      case 1:
        return <AddParticipantsForm
          selectedRows={selectedParticipants}
          handleSelectedRowsChange={handleSelectedParticipantsChange}
        />;
      case 2:
        return (
          <React.Fragment>
            <Typography variant="h6" gutterBottom>
              Enter task details:
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileDateTimePicker
                    slotProps={{ textField: { size: 'small' } }}
                    ampm={false}
                    format='DD/MM/YYYY HH:mm'
                    value={taskStartDate}
                    readOnly
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={10} >
                <Typography>
                  Task end date:
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileDateTimePicker
                    slotProps={{ textField: { size: 'small' } }}
                    ampm={false}
                    format='DD/MM/YYYY HH:mm'
                    value={taskEndDate}
                    readOnly
                  />
                </LocalizationProvider>
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
            Create new patrolling task
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
                Task successfully created
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
                  {activeStep === steps.length - 1 ? 'Create task' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}