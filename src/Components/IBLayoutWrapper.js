// IBLayoutWrapper.js
import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import IBLayout from "./IBLayout";

export default function IBLayoutWrapper(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    return <IBLayout {...props} params={params} history={{ push: navigate }} location={location} />;
}