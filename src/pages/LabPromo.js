// src/pages/LabPromo.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios 인스턴스 사용 (BASE_URL 설정돼 있음)
import LabCard from "../components/LabCard.js";
import "../styles/LabPromo.css";

function LabPromo() {
	const [labs, setLabs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errMsg, setErrMsg] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				// GET /api/labs
				const res = await api.get("/api/labs");
				// 응답 예시:
				// { status:200, message:"...", data:[ {id,name,description,ranking,professorName,createdAt}, ... ] }
				const payload = res?.data;

				const listRaw = Array.isArray(payload?.data)
					? payload.data
					: payload?.data
					? [payload.data]
					: [];

				// 필요 시 정렬(랭킹 오름차순)
				const list = [...listRaw].sort(
					(a, b) =>
						(a?.ranking ?? Number.MAX_SAFE_INTEGER) -
						(b?.ranking ?? Number.MAX_SAFE_INTEGER)
				);

				if (mounted) {
					setLabs(list);
					setErrMsg("");
				}
			} catch (err) {
				console.error(
					"[LabPromo] GET /api/labs failed:",
					err?.response?.status,
					err?.response?.data || err
				);
				if (mounted) {
					setErrMsg("랩실 목록을 불러오지 못했습니다.");
					setLabs([]);
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	return (
		<div className="labpromo-root">
			<div className="labpromo-title">한신대학교 랩실을 소개합니다.</div>

			<div className="labpromo-topbar">
				<button
					className="labpromo-create-btn"
					onClick={() => navigate("/create-lab")}
				>
					랩실을 개설하시겠습니까?
				</button>
			</div>

			{loading ? (
				<div className="labpromo-empty">랩실 목록을 불러오는 중...</div>
			) : errMsg ? (
				<div className="labpromo-empty">{errMsg}</div>
			) : labs.length === 0 ? (
				<div className="labpromo-empty">등록된 랩실이 없습니다.</div>
			) : (
				<div className="labpromo-grid">
					{labs.map((lab) => (
						<div
							key={lab.id}
							onClick={() => navigate(`/lab/${lab.id}`)}
							style={{ cursor: "pointer" }}
						>
							<LabCard
								id={lab.id}
								title={lab.name}
								description={lab.description}
								// API에 이미지 없음 → 컴포넌트에서 placeholder 처리하거나 여기서 null 전달
								image={lab.imageUrl || lab.image || null}
								// API 필드명: professorName
								professor={lab.professorName ?? "미정"}
								// API 필드명: createdAt
								createdAt={lab.createdAt}
								// 랭킹 점수
								likes={lab.ranking ?? 0}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default LabPromo;
