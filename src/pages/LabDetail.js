import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api"; // ✅ api 객체 불러오기
import CommentList from "../components/CommentList";
import LikeButton from "../components/LikeButton";
import "../styles/LabDetail.css";

function LabDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [lab, setLab] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isOwner, setIsOwner] = useState(false);
	const [joined, setJoined] = useState(false);
	const [likes, setLikes] = useState(0);
	const [liked, setLiked] = useState(false);
	const [comments, setComments] = useState([]);

	useEffect(() => {
		const fetchLab = async () => {
			try {
				const res = await api.get(`/api/labs/${id}`);
				const data = res.data;

				if (data.success && data.data) {
					const labData = data.data;
					setLab({
						id: labData.id,
						title: labData.name,
						content: labData.description,
						image: "", // 이미지 필드 없으므로 공백
						author: "", // 작성자 없음
						createdAt: new Date(data.timestamp).toLocaleDateString("ko-KR", {
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
						}),
						professor: labData.professorName || "정보 없음",
						likes: labData.rank ?? 0,
					});
					setLikes(labData.rank ?? 0);
				} else {
					setLab(null);
				}

				setIsOwner(false);
				setJoined(false);
				setComments([]);
			} catch (error) {
				console.error("랩실 정보 로딩 실패", error);
				setLab(null);
			} finally {
				setLoading(false);
			}
		};

		fetchLab();
	}, [id]);

	if (loading || !lab) return <div className="labdetail-root">로딩 중...</div>;

	return (
		<div className="labdetail-root">
			<div className="labdetail-title">{lab.title}</div>
			<div className="labdetail-meta">
				<span>작성자: {lab.author || "정보 없음"}</span>
				<span>교수: {lab.professor}</span>
				<span>작성일: {lab.createdAt}</span>
			</div>
			{lab.image ? (
				<img className="labdetail-image" src={lab.image} alt={lab.title} />
			) : (
				<div
					className="labdetail-image"
					style={{
						height: "180px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#67509C",
					}}
				>
					No Image
				</div>
			)}
			<div className="labdetail-content">{lab.content}</div>
			<div className="labdetail-actions">
				<LikeButton
					liked={liked}
					onClick={() => {
						setLiked(!liked);
						setLikes(likes + (liked ? -1 : 1));
					}}
				/>
				<span className="labdetail-likes">{likes}</span>
				{!joined && (
					<button
						className="labdetail-join-btn"
						onClick={() => navigate(`/lab/${lab.id}/join`)}
					>
						랩실 가입하기
					</button>
				)}
				{isOwner && (
					<>
						<button
							className="labdetail-edit-btn"
							onClick={() => navigate(`/create-lab?id=${lab.id}`)}
						>
							수정
						</button>
						<button
							className="labdetail-delete-btn"
							onClick={() => alert("삭제 기능 구현 필요")}
						>
							삭제
						</button>
					</>
				)}
			</div>
			<div className="labdetail-comments">
				<CommentList comments={comments} />
			</div>
		</div>
	);
}

export default LabDetail;
