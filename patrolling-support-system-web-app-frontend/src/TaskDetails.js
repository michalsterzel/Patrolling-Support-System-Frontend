import { useParams } from "react-router-dom";
import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config.js";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import TaskDetailsComponent from "./Components/TaskDetailsComponent.js";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import MapIcon from "@mui/icons-material/Map";
import CheckpointIcon from "@mui/icons-material/LocationOn";
import ChatIcon from "@mui/icons-material/Chat";
import { MapView } from "./LiveMap";
import { CheckpointsView } from "./ChecpointsMap.js";
import PatrolGroupChatComponent from "./Components/PatrolGroupChatComponent.js"
import AssignmentIcon from '@mui/icons-material/Assignment';
import { SubtaskComponent } from "./Components/SubtaskComponent.js";
import { PatrolParticipantReportComponent } from "./Components/PatrolParticipantReportComponent.js";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const mdTheme = createTheme({
  palette: {
    primary: {
      main: "#A9AC5D",
    },
    secondary: {
      main: "#E8E1DB",
    },
    tertiary: {
      default: "#3A3C26",
    },
    background: {
      default: "#E8E1DB",
    },
  },
});

export function TaskDetails() {
  const { taskId } = useParams();
  const [open, setOpen] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState("");
  const [signal, setSignal] = React.useState({});
  const[chatParticipant, setChatParticipant] = React.useState({});
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const navigate = useNavigate();

  const handleReturnClick = () => {
    navigate("/home");
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
      const docRef = doc(database, "Tasks", `${taskId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDocumentData(Object.assign({}, docSnap.data()));
        setIsLoaded(true);
      } else {
        console.log("No such document!");
      }
    }
  };

  React.useEffect(() => {
    getDocumentDetails();
  }, [signal]);

  React.useEffect(() => {
    function_name();
  }, [chatParticipant])

  const function_name = () => {
    setSelectedComponent(
      <PatrolGroupChatComponent documentData={documentData}  patrolParticipantId={chatParticipant}/>
    );
    setCurrentPage("chat")
  }

  React.useEffect(() => {
    if (documentData) {
      setSelectedComponent(
        <TaskDetailsComponent documentData={documentData} />
      );
      // Tutaj do rozważenia czy warto się z tym babrać i naprawiać
      // setCurrentPage("details")
    }
  }, [documentData]);

  const [isLoaded, setIsLoaded] = React.useState(false);

  const [selectedComponent, setSelectedComponent] = React.useState(null);

  const handleMapParticipantClick = () => {

  }

  const mapPageToComponent = (page) => {
    if (page === "details") {
      return <TaskDetailsComponent documentData={documentData} />;
    } else if (page === "map") {
      return <MapView documentData={documentData} setChatParticipant={setChatParticipant} />;
    } else if (page === "checkpoints") {
      return (
        <CheckpointsView documentData={documentData} setSignal={setSignal} />
      );
    } else if (page === "chat") {
      return <PatrolGroupChatComponent documentData={documentData} patrolParticipantId={null} />;
    } else if (page === "subtasks") {
      return <SubtaskComponent documentData={documentData} />;
    } else if (page === "reports") {
      return <PatrolParticipantReportComponent documentData={documentData} />;
    }
  };

  React.useEffect(() => {
    setSelectedComponent(mapPageToComponent(currentPage));
  }, [currentPage, documentData]);

  const mainListItems = (
    <React.Fragment>
      <ListItemButton onClick={() => setCurrentPage("details")}>
        <ListItemIcon>
          <ListAltIcon />
        </ListItemIcon>
        <ListItemText primary="Task details" />
      </ListItemButton>
      <ListItemButton onClick={() => setCurrentPage("map")}>
        <ListItemIcon>
          <MapIcon />
        </ListItemIcon>
        <ListItemText primary="View map" />
      </ListItemButton>
      <ListItemButton onClick={() => setCurrentPage("checkpoints")}>
        <ListItemIcon>
          <CheckpointIcon />
        </ListItemIcon>
        <ListItemText primary="Checkpoints" />
      </ListItemButton>
      <ListItemButton onClick={() => setCurrentPage("subtasks")}>
        <ListItemIcon>
          <AssignmentIcon />
        </ListItemIcon>
        <ListItemText primary="Subtasks" />
      </ListItemButton>
      <ListItemButton onClick={() => setCurrentPage("reports")}>
        <ListItemIcon>
          <ReportProblemIcon />
        </ListItemIcon>
        <ListItemText primary="Patrol Reports" />
      </ListItemButton>
      <ListItemButton onClick={() => setCurrentPage("chat")}>
        <ListItemIcon>
          <ChatIcon />
        </ListItemIcon>
        <ListItemText primary="Patrol group chat" />
      </ListItemButton>
    </React.Fragment>
  );


  const secondaryListItems = (
    <React.Fragment>
      <ListItemButton onClick={() => handleReturnClick()}>
        <ListItemIcon>
          <KeyboardReturnIcon />
        </ListItemIcon>
        <ListItemText primary="Return to home" />
      </ListItemButton>
    </React.Fragment>
  );

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            {isLoaded ? (
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                Task details
              </Typography>
            ) : (
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                Loading data...
              </Typography>
            )}
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
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
            {secondaryListItems}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {isLoaded ? (
              <div className="render-container">{selectedComponent}</div>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
