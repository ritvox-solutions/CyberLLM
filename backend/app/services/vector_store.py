import json
import os
import re
import math
from typing import List, Dict, Any, Tuple
import numpy as np
from app.config import settings
from app.models.schemas import SOPChunk

class VectorStore:
    def __init__(self, storage_path: str = settings.INDEX_FILE):
        self.storage_path = storage_path
        self.chunks: List[SOPChunk] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.chunk_vectors: List[np.ndarray] = []
        self.load()

    def _tokenize(self, text: str) -> List[str]:
        # Lowercase, alphanumeric words, cybersecurity-relevant tokens (IPs, domains, flags)
        tokens = re.findall(r'[a-zA-Z0-9_\-\.]{2,}', text.lower())
        return tokens

    def _build_tfidf_vector(self, text: str) -> np.ndarray:
        tokens = self._tokenize(text)
        if not self.vocabulary:
            return np.zeros(1)
        
        vec = np.zeros(len(self.vocabulary), dtype=np.float32)
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        
        doc_len = max(len(tokens), 1)
        for term, count in tf.items():
            if term in self.vocabulary:
                idx = self.vocabulary[term]
                # Log-scaled TF * IDF
                tf_val = (1 + math.log(count)) / doc_len
                idf_val = self.idf.get(term, 1.0)
                vec[idx] = tf_val * idf_val
        
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def reindex(self):
        """Recompute vocabulary, IDF, and TF-IDF vectors across all SOP chunks."""
        if not self.chunks:
            self.vocabulary = {}
            self.idf = {}
            self.chunk_vectors = []
            return

        # 1. Build vocabulary & document frequency
        df: Dict[str, int] = {}
        all_doc_tokens = []
        for chunk in self.chunks:
            full_text = f"{chunk.title} {chunk.section} {chunk.content} {' '.join(chunk.keywords)}"
            tokens = set(self._tokenize(full_text))
            all_doc_tokens.append(tokens)
            for t in tokens:
                df[t] = df.get(t, 0) + 1

        # Keep terms appearing in at least 1 chunk
        self.vocabulary = {term: idx for idx, term in enumerate(sorted(df.keys()))}
        n_docs = len(self.chunks)
        self.idf = {term: math.log((n_docs + 1) / (count + 1)) + 1.0 for term, count in df.items()}

        # 2. Vectorize all chunks
        self.chunk_vectors = []
        for chunk in self.chunks:
            full_text = f"{chunk.title} {chunk.section} {chunk.content} {' '.join(chunk.keywords)}"
            vec = self._build_tfidf_vector(full_text)
            self.chunk_vectors.append(vec)

        self.save()

    def add_chunks(self, new_chunks: List[SOPChunk]):
        # Deduplicate by chunk_id
        existing_ids = {c.chunk_id for c in self.chunks}
        for chunk in new_chunks:
            if chunk.chunk_id in existing_ids:
                self.chunks = [c for c in self.chunks if c.chunk_id != chunk.chunk_id]
            self.chunks.append(chunk)
        self.reindex()

    def remove_by_sop_id(self, sop_id: str):
        self.chunks = [c for c in self.chunks if c.sop_id != sop_id]
        self.reindex()

    def search(self, query: str, top_k: int = 4, threshold: float = 0.05) -> List[Tuple[SOPChunk, float]]:
        """Retrieve top-k relevant chunks based on cosine similarity."""
        if not self.chunks or not self.chunk_vectors:
            return []

        query_vec = self._build_tfidf_vector(query)
        q_norm = np.linalg.norm(query_vec)
        if q_norm == 0:
            # Fallback keyword match
            q_terms = set(self._tokenize(query))
            scored = []
            for chunk in self.chunks:
                text_terms = set(self._tokenize(f"{chunk.title} {chunk.content}"))
                overlap = len(q_terms.intersection(text_terms))
                score = overlap / max(len(q_terms), 1)
                scored.append((chunk, score))
            scored.sort(key=lambda x: x[1], reverse=True)
            return [(c, s) for c, s in scored[:top_k] if s > 0]

        scores = []
        for i, doc_vec in enumerate(self.chunk_vectors):
            if doc_vec.shape[0] != query_vec.shape[0]:
                continue
            cos_sim = float(np.dot(query_vec, doc_vec))
            scores.append((self.chunks[i], cos_sim))

        scores.sort(key=lambda x: x[1], reverse=True)
        results = [item for item in scores if item[1] >= threshold]
        return results[:top_k]

    def save(self):
        data = {
            "chunks": [c.model_dump() for c in self.chunks],
            "vocabulary": self.vocabulary,
            "idf": self.idf
        }
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.chunks = [SOPChunk(**c) for c in data.get("chunks", [])]
                    self.vocabulary = data.get("vocabulary", {})
                    self.idf = data.get("idf", {})
                
                # Rebuild vectors for loaded chunks
                self.chunk_vectors = []
                for chunk in self.chunks:
                    full_text = f"{chunk.title} {chunk.section} {chunk.content} {' '.join(chunk.keywords)}"
                    self.chunk_vectors.append(self._build_tfidf_vector(full_text))
            except Exception as e:
                print(f"Warning: could not load vector index: {e}")
                self.chunks = []

vector_store = VectorStore()
