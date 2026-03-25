import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import RelValLayout from "./RelValLayout";

export default function RelValLayoutWrapper(props) {
    const params = useParams();
    const navigate = useNavigate();      
    const location = useLocation();

    // Parse query parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const selectedArchs = searchParams.getAll('selectedArchs');
    const selectedGPUs = searchParams.getAll('selectedGPUs');
    const selectedOthers = searchParams.getAll('selectedOthers');
    const selectedFlavors = searchParams.getAll('selectedFlavors');
    const selectedStatus = searchParams.getAll('selectedStatus');

    console.log("🔍 URL Filters:", {
        selectedArchs,
        selectedGPUs,
        selectedOthers,
        selectedFlavors,
        selectedStatus
    });

    // Pass navigate, location, and filters as props
    return <RelValLayout 
        {...props} 
        params={params} 
        navigate={navigate} 
        location={location}
        selectedArchs={selectedArchs}
        selectedGPUs={selectedGPUs}
        selectedOthers={selectedOthers}
        selectedFlavors={selectedFlavors}
        selectedStatus={selectedStatus}
    />;
}