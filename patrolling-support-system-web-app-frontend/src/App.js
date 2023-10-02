import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "./Login";
import { Home } from "./Home";
import { CreateTask } from "./CreateTask";
import { ViewTask } from "./viewTasks";
import { AccountSettings } from "./AccountSettings";
import { ResetPasswordForm } from "./Forms/ResetPasswordForm";
import { ChangePasswordForm } from "./Forms/ChangePasswordForm";
import { TaskDetails } from "./TaskDetails";
import { EditTaskComponent } from "./Components/EditTaskComponent";
import { MapView } from "./LiveMap";
import PatrolGroupChatComponent from "./Components/PatrolGroupChatComponent";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route exact path="/home" element={<Home />} />
        <Route exact path="/createTask" element={<CreateTask />} />
        <Route exact path="/viewTasks" element={<ViewTask />} />
        <Route path="/viewTasks/:taskId" element={<TaskDetails />} />
        <Route path="/editTask/:taskId" element={<EditTaskComponent />} />
        <Route exact path="/AccountSettings" element={<AccountSettings />} />
        <Route exact path="/ResetPassword" element={<ResetPasswordForm />} />
        <Route exact path="/changePassword" element={<ChangePasswordForm />} />
        <Route exact path="/maps" element={<MapView />} />
      </Routes>
    </Router>
  );
}

export default App;
