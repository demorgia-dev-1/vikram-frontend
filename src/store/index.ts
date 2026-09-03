import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";
import customersReducer from "./customersSlice";
import productWorkflowReducer from "./productWorkflowSlice";
import productsReducer from "./productsSlice";
import usersReducer from "./usersSlice";
import workflowTemplatesReducer from "./workflowTemplatesSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      users: usersReducer,
      customers: customersReducer,
      products: productsReducer,
      productWorkflow: productWorkflowReducer,
      workflowTemplates: workflowTemplatesReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
