import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { loadCalibrations } from "@/store/slices/calibrationSlice";
import { loadTanks } from "@/store/slices/tanksSlice";
import { Layout } from "@/components/common/Layout";
import { Loader } from "@/components/common/Loader";
import { SingleCalculation } from "@/components/Calculations/SingleCalculation";
import { DataTable } from "@/components/DataTable/DataTable";
import { ReportTable } from "@/components/Reports/ReportTable";

export function App() {
  const dispatch = useAppDispatch();
  const calibration = useAppSelector((s) => s.calibration);
  const tanks = useAppSelector((s) => s.tanks);

  useEffect(() => {
    if (!calibration.loaded && !calibration.loading) {
      void dispatch(loadCalibrations());
    }
    if (!tanks.loaded && !tanks.loading) {
      void dispatch(loadTanks());
    }
  }, [dispatch, calibration.loaded, calibration.loading, tanks.loaded, tanks.loading]);

  if (calibration.error) {
    return (
      <Layout>
        <div
          role="alert"
          style={{
            padding: 16,
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            borderRadius: 12,
          }}
        >
          <strong>Помилка завантаження калібровок:</strong> {calibration.error}
        </div>
      </Layout>
    );
  }

  if (!calibration.loaded) {
    return (
      <Layout>
        <Loader message="Завантажую калібрувальну таблицю…" />
      </Layout>
    );
  }

  return (
    <Layout>
      <SingleCalculation />
      <DataTable />
      <ReportTable />
    </Layout>
  );
}
