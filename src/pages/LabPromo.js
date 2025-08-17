// src/pages/LabPromo.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Link 추가
import api from "../api";
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
				const res = await api.get("/api/labs");
				const payload = res?.data;
				const listRaw = Array.isArray(payload?.data)
					? payload.data
					: payload?.data
					? [payload.data]
					: [];

				// 정렬 시 ranking(목록) / rank(상세 스키마) 모두 대비
				const getRank = (x) => x?.ranking ?? x?.rank ?? Number.MAX_SAFE_INTEGER;

				const list = [...listRaw].sort((a, b) => getRank(a) - getRank(b));

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
						<Link
							key={lab.id}
							to={`/lab/${lab.id}`} // ✅ Link로 라우팅
							className="labpromo-card-link" // (선택) 스타일용 클래스
							aria-label={`${lab.name} 상세 보기`}
						>
							<LabCard
								id={lab.id}
								title={lab.name}
								description={lab.description}
								image={lab.imageUrl || lab.image || null}
								professor={lab.professorName ?? "미정"}
								createdAt={lab.createdAt}
								likes={lab.ranking ?? lab.rank ?? 0} // ✅ ranking/rank 모두 대비
							/>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default LabPromo;
