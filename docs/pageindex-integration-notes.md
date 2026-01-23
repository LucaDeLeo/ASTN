# PageIndex Integration Notes

## What is PageIndex?

[PageIndex](https://github.com/VectifyAI/PageIndex) is a reasoning-based RAG system that builds hierarchical tree indexes from documents. Instead of vector similarity (which doesn't equal relevance), it uses LLM reasoning to navigate document structure—mimicking how humans find information in complex documents.

**Key difference from traditional RAG:**
- No chunking - documents organized into natural sections
- No vector DB required - uses document structure + LLM reasoning
- Traceable - all retrievals have page/section references
- Better for structured documents (guides, reports, manuals)

## How It Works

1. **Indexing** (one-time per document):
   - Detects table of contents
   - Builds hierarchical tree with sections/subsections
   - Maps each node to page ranges
   - Optionally generates summaries for each node
   - Outputs JSON tree structure

2. **Query time**:
   - LLM receives query + tree structure
   - Reasons about which nodes likely contain the answer
   - Retrieves actual text from those page ranges
   - Answers with grounded context

## Fit Assessment for ASTN

### Where PageIndex Fits Well

**1. Career Counselor Knowledge Base**
The LLM career counselor needs to give advice "grounded in 80k thinking, AI safety landscape." PageIndex enables verifiably grounded advice with citations rather than vibes-based recommendations.

**2. Opportunity Exploration (High Value)**
Programs like MATS and SPAR have many individual projects with rich descriptions—mentor research agendas, requirements, project details. This isn't simple job listing data; it's document-like content that benefits from structured navigation.

The current matching system answers "which opportunities fit me?" but users also need to answer "what's actually out there and how do I think about it?"—especially when uncertain about their direction.

**Example exploration queries PageIndex enables:**
- "Compare ARC's and Redwood's research approaches"
- "Which MATS projects involve interpretability and don't require a PhD?"
- "Which SPAR projects are good for someone transitioning from SWE?"
- "What does day-to-day work at METR look like?"

### Where PageIndex Doesn't Fit

- **User profiles** - Structured data, not documents. Use normal DB.
- **Opportunity matching** - Profile ↔ opportunity scoring. Different problem (the existing matching system handles this).
- **Application pre-fill** - Profile → form field mapping. Different problem.
- **Real-time aggregation** - Job board scraping. Different infrastructure.

### Recommendation

**Phase 2 enhancement** once opportunity volume grows. Not needed for initial pilot with 50-100 profiles, but becomes valuable when:
- MATS/SPAR/AISC project listings are rich enough to index
- Users need to explore and understand the opportunity landscape, not just get matches
- Counselor advice quality matters enough to justify grounding infrastructure

## Proposed Use Cases

### Use Case 1: Career Counselor Knowledge Base

#### Documents to Index

**Core career guidance:**
- 80,000 Hours career guide (primary - large, well-structured)
- 80k problem profiles and career reviews
- AI safety field guides (AGISF curriculum docs, intro materials)

**Program/org information:**
- MATS program guide and requirements
- SERI program details
- AISC, Astra Fellowship, other program docs
- Org profiles (Anthropic, Redwood, ARC, METR, etc.)

**Research landscape:**
- Key research agendas (Anthropic core views, ARC research agenda, etc.)
- Field overviews (interpretability, alignment theory, governance)
- Technical AI safety curriculum materials

#### Why This Matters

**Without structured retrieval:**
> "You should consider technical AI safety roles if you have a strong ML background."

**With PageIndex-grounded retrieval:**
> "Based on 80k's analysis of technical AI safety careers (Career Guide, Section 4.2), your ML background is a strong fit. They specifically note that 'researchers with experience in [X] are particularly needed for interpretability work.' However, they also flag that publication record matters for research roles—your profile doesn't highlight publications yet. See their full analysis: [link to section]"

The counselor becomes **verifiably grounded** rather than vibes-based.

### Use Case 2: Opportunity Exploration

#### The Problem

Programs like MATS and SPAR have dozens of individual projects. Each mentor has:
- Research agenda and background
- Project description and goals
- Specific requirements and expectations
- Context about what the work looks like

This is dense, document-like content. Users asking "which projects focus on evals?" or "what's the difference between these two mentors' approaches?" need to reason over this structure.

#### How PageIndex Helps

Index each program (MATS, SPAR, AISC) as a document where project listings become the hierarchical structure. The counselor can then navigate:

> "Based on your interest in evals, here are three MATS projects—[Mentor A's project] focuses on dangerous capability evals (see project description), while [Mentor B] works on benchmarking. Given your SWE background without ML research experience, Mentor B's project might be more accessible—they note 'strong engineering skills valued' in their requirements."

This fills the "help me understand what's out there" gap that pure matching doesn't cover.

## Architecture: Hybrid PageIndex + Vector

For scale (dozens to hundreds of documents), combine approaches:

```
User query
    │
    ▼
┌─────────────────────────────────┐
│  Vector search on node summaries │  ← Fast, broad retrieval
│  (find candidate docs/sections)  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  PageIndex tree navigation       │  ← Precise, structured
│  (pinpoint exact sections)       │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  LLM answers with citations      │  ← "Based on 80k career guide,
│                                  │     Section 3.2 (page 47)..."
└─────────────────────────────────┘
```

## Implementation Sketch

```python
# 1. Build indexes (one-time)
from pageindex import page_index

docs = [
    "80k_career_guide.pdf",
    "mats_program_guide.pdf",
    # ...
]

for doc in docs:
    tree = page_index(
        doc=doc,
        if_add_node_summary="yes",
        if_add_doc_description="yes"
    )
    save_to_db(tree)
    embed_node_summaries(tree)  # for vector search layer

# 2. Query time
def counselor_retrieve(query: str) -> str:
    # Vector search for candidate nodes
    candidates = vector_db.search(query, top_k=20)

    # Get tree context for candidates
    trees = get_trees_for_nodes(candidates)

    # LLM reasons over trees to find exact sections
    relevant_nodes = llm_tree_navigate(query, trees)

    # Extract text from those sections
    context = extract_text(relevant_nodes)

    return context

# 3. Counselor uses grounded context
def counselor_respond(user_message: str, profile: dict) -> str:
    context = counselor_retrieve(user_message)

    response = llm(f"""
    You are an AI safety career counselor.

    User profile: {profile}
    User message: {user_message}

    Relevant knowledge base context:
    {context}

    Give specific, grounded advice. Cite sources.
    """)

    return response
```

## Cost Considerations

**Indexing (one-time):**
- ~$0.50-3.00 per document depending on size
- 50 documents ≈ $25-150 total
- Only re-run when documents update

**Query time:**
- Vector search: cheap (local or hosted embeddings)
- Tree navigation: 1 LLM call for node selection
- Answer generation: 1 LLM call
- Total: ~$0.01-0.05 per query (depends on model)

## Implementation Considerations

**Python dependency:** ASTN is TypeScript/Convex. PageIndex would need either:
- A separate Python microservice
- A Convex action calling an external API
- Porting the tree navigation logic to TypeScript (index building could stay Python)

**LLM provider:** PageIndex defaults to GPT-4o. Would need to configure for Claude or accept the vendor split.

## Scaling Notes

- PageIndex works well for individual document depth
- For corpus-level search (100s of docs), the vector layer is essential
- Consider caching common queries (e.g., "what is MATS?" gets asked a lot)
- Document updates: re-index changed docs, update embeddings

## Next Steps to Explore

1. Test PageIndex on 80k career guide - see output quality
2. Index a MATS round's project descriptions - evaluate navigation quality
3. Evaluate if tree structure captures useful navigation for program docs
4. Prototype counselor with single document
5. Design embedding + storage architecture for scale
6. Estimate full document corpus and indexing costs

## Resources

- PageIndex repo: https://github.com/VectifyAI/PageIndex
- Example notebooks: `cookbook/` directory in repo
- Multi-doc search strategies: `tutorials/doc-search/`
- Requires OpenAI API key (uses GPT-4o by default, configurable)
