import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import { uploadHealthArticleImage } from '../lib/healthArticleImageUpload'
import MarkdownContent from '../components/health/MarkdownContent'
import CreditedImage from '../components/health/CreditedImage'
import './AdminHealthHubPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const emptyDraft = {
  title: '', slug: '', categoryId: '', summary: '', body: '', coverImageUrl: '', coverImageCredit: '', coverImageSourceUrl: '', coverImageIsOurs: true,
  authorName: '', reviewerName: '', seoTitle: '', seoDescription: '',
}

function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

function AdminHealthHubPage() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { isAdmin, loading, accessToken } = useAuth()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [draft, setDraft] = useState(emptyDraft)
  const [status, setStatus] = useState('draft')
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [pageError, setPageError] = useState('')
  const [preview, setPreview] = useState(false)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [pendingInlineImage, setPendingInlineImage] = useState(null)
  const [inlineImageAlt, setInlineImageAlt] = useState('')
  const [inlineImageIsOurs, setInlineImageIsOurs] = useState(true)
  const [inlineImageCredit, setInlineImageCredit] = useState('')
  const [inlineImageSourceUrl, setInlineImageSourceUrl] = useState('')
  const cursorPositionRef = useRef({ start: 0, end: 0 })
  const editorRef = useRef(null)
  const imageInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const isEditing = Boolean(articleId && articleId !== 'new')
  const isEditor = Boolean(articleId)

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) return undefined
    let active = true
    const load = async () => {
      setPageLoading(true)
      setPageError('')
      try {
        const [categoriesResponse, articlesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/health-hub/categories`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${apiBaseUrl}/api/admin/health-hub/articles`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ])
        const [categoriesPayload, articlesPayload] = await Promise.all([categoriesResponse.json(), articlesResponse.json()])
        if (!categoriesResponse.ok) throw new Error(categoriesPayload.message || 'Unable to load Health Hub categories.')
        if (!articlesResponse.ok) throw new Error(articlesPayload.message || 'Unable to load Health Hub articles.')
        if (!active) return
        setCategories(categoriesPayload.categories || [])
        setArticles(articlesPayload.articles || [])
        if (articleId === 'new') {
          setDraft((current) => ({ ...current, categoryId: current.categoryId || categoriesPayload.categories?.[0]?.id || '' }))
        } else if (articleId) {
          const articleResponse = await fetch(`${apiBaseUrl}/api/admin/health-hub/articles/${articleId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
          const articlePayload = await articleResponse.json()
          if (!articleResponse.ok) throw new Error(articlePayload.message || 'Unable to load this article.')
          if (!active) return
          const article = articlePayload.article
          setDraft({
            title: article.title || '', slug: article.slug || '', categoryId: article.category_id || '',
            summary: article.summary || '', body: article.body || '', coverImageUrl: article.cover_image_url || '',
            coverImageCredit: article.cover_image_credit || '', coverImageSourceUrl: article.cover_image_source_url || '',
            coverImageIsOurs: !article.cover_image_credit && !article.cover_image_source_url,
            authorName: article.author_name || '', reviewerName: article.reviewer_name || '',
            seoTitle: article.seo_title || '', seoDescription: article.seo_description || '',
          })
          setStatus(article.status || 'draft')
        }
      } catch (error) {
        if (active) setPageError(getFriendlyErrorMessage(error, 'We could not load the Health Hub workspace.'))
      } finally {
        if (active) setPageLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [accessToken, articleId, isAdmin, loading])

  const updateField = (field, value) => setDraft((current) => ({ ...current, [field]: value }))

  const insertAtCursor = (value) => {
    const editor = editorRef.current
    if (!editor) return
    const start = cursorPositionRef.current.start ?? editor.selectionStart ?? draft.body.length
    const end = cursorPositionRef.current.end ?? editor.selectionEnd ?? start
    const nextBody = `${draft.body.slice(0, start)}${value}${draft.body.slice(end)}`
    cursorPositionRef.current = { start: start + value.length, end: start + value.length }
    updateField('body', nextBody)
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(start + value.length, start + value.length)
    })
    setContextMenu(null)
  }

  const openInlineImagePicker = () => {
    const editor = editorRef.current
    if (editor) cursorPositionRef.current = { start: editor.selectionStart, end: editor.selectionEnd }
    imageInputRef.current?.click()
  }

  const selectInlineImage = (file) => {
    if (!file) return
    setPendingInlineImage(file)
    setInlineImageAlt('')
    setInlineImageIsOurs(true)
    setInlineImageCredit('')
    setInlineImageSourceUrl('')
    setMessage('Add image details before inserting it.')
  }

  const insertInlineImage = async () => {
    if (!pendingInlineImage) return
    if (!inlineImageAlt.trim()) {
      setMessage('Add a short image description before inserting the image.')
      return
    }
    if (!inlineImageIsOurs && !inlineImageCredit.trim() && !inlineImageSourceUrl.trim()) {
      setMessage('Add an image credit or source link for an image that is not owned by Mediscripts.')
      return
    }
    if (inlineImageSourceUrl.trim() && !isHttpsUrl(inlineImageSourceUrl.trim())) {
      setMessage('Enter a valid HTTPS image source link.')
      return
    }
    setUploadingImage(true)
    setMessage('Uploading image...')
    try {
      const imageUrl = await uploadHealthArticleImage(pendingInlineImage, 'inline')
      const attribution = inlineImageIsOurs ? '' : ` {credit=${encodeURIComponent(inlineImageCredit.trim())} source=${encodeURIComponent(inlineImageSourceUrl.trim())}}`
      const safeAlt = inlineImageAlt.trim().replace(/[\[\]]/g, '')
      insertAtCursor(`\n![${safeAlt}](${imageUrl})${attribution}\n`)
      setMessage('Image added at the cursor.')
      setPendingInlineImage(null)
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error, 'We could not upload this image.'))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCoverImage = async (file) => {
    if (!file) return
    setUploadingImage(true)
    setMessage('Uploading cover image...')
    try {
      updateField('coverImageUrl', await uploadHealthArticleImage(file, 'covers'))
      updateField('coverImageCredit', '')
      updateField('coverImageSourceUrl', '')
      updateField('coverImageIsOurs', true)
      setMessage('Cover image uploaded.')
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error, 'We could not upload this cover image.'))
    } finally {
      setUploadingImage(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const createCategory = async (event) => {
    event?.preventDefault()
    setSavingCategory(true)
    setMessage('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/health-hub/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: categoryName, description: categoryDescription }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Unable to create category.')
      setCategories((current) => [...current, payload.category].sort((a, b) => a.display_order - b.display_order))
      updateField('categoryId', payload.category.id)
      setCategoryName('')
      setCategoryDescription('')
      setShowCategoryForm(false)
      setMessage(`Category “${payload.category.name}” added.`)
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error, 'We could not add that category.'))
    } finally {
      setSavingCategory(false)
    }
  }

  const saveArticle = async (event, requestedStatus = 'draft') => {
    event?.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      if (!draft.title.trim()) throw new Error('Add an article title before saving.')
      if (!draft.categoryId) throw new Error('Choose an article category before saving.')
      if (draft.coverImageUrl && !draft.coverImageIsOurs && !draft.coverImageCredit.trim() && !draft.coverImageSourceUrl.trim()) {
        throw new Error('Add a cover image credit or source link for an image not owned by Mediscripts.')
      }
      if (draft.coverImageSourceUrl.trim() && !isHttpsUrl(draft.coverImageSourceUrl.trim())) {
        throw new Error('Enter a valid HTTPS cover image source link.')
      }
      if (requestedStatus === 'published' && (!draft.reviewerName.trim() || !reviewConfirmed)) {
        throw new Error('Add the qualified reviewer’s name and confirm review before publishing.')
      }

      const payload = {
        ...draft,
        coverImageCredit: draft.coverImageIsOurs ? '' : draft.coverImageCredit,
        coverImageSourceUrl: draft.coverImageIsOurs ? '' : draft.coverImageSourceUrl,
        slug: draft.slug || draft.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }
      const endpoint = `${apiBaseUrl}/api/admin/health-hub/articles${isEditing ? `/${articleId}` : ''}`
      const response = await fetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...payload, status: isEditing ? requestedStatus : 'draft' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to save this article.')
      let savedArticle = result.article

      if (!isEditing && requestedStatus !== 'draft') {
        const reviewResponse = await fetch(`${apiBaseUrl}/api/admin/health-hub/articles/${savedArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ status: requestedStatus, reviewerName: draft.reviewerName, reviewConfirmed }),
        })
        const reviewResult = await reviewResponse.json()
        if (!reviewResponse.ok) throw new Error(reviewResult.message || 'Article saved, but its status could not be updated.')
        savedArticle = reviewResult.article
      }

      setMessage(requestedStatus === 'published' ? 'Article published.' : requestedStatus === 'in_review' ? 'Article sent for review.' : 'Draft saved.')
      setStatus(savedArticle.status)
      if (!isEditing) navigate(`/admin/health-hub/${savedArticle.id}`, { replace: true })
      else setArticles((current) => current.map((item) => item.id === savedArticle.id ? { ...item, ...savedArticle } : item))
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error, 'We could not save this article.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="admin-shell"><p className="admin-helper">Checking admin access...</p></main>
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  if (!isEditor) {
    return (
      <main className="admin-shell health-admin">
        <div className="health-admin__top"><div><p className="admin-kicker">Content workspace</p><h1>Health Hub articles</h1><p>Write, review, and publish useful health education for Mediscripts readers.</p></div><div className="health-admin__top-actions"><Link className="admin-button admin-button--ghost" to="/admin">Back to dashboard</Link><Link className="admin-button" to="/admin/health-hub/new">Write an article</Link></div></div>
        {pageLoading ? <p className="admin-helper">Loading articles...</p> : null}
        {pageError ? <p className="admin-error">{pageError}</p> : null}
        <section className="health-admin__list">
          {articles.map((article) => <Link className="health-admin__row" key={article.id} to={`/admin/health-hub/${article.id}`}>
            <div><span>{article.health_article_categories?.name || 'Health Hub'} · {article.status.replace('_', ' ')}</span><h2>{article.title}</h2><p>{article.summary || 'No summary yet.'}</p><small>By {article.author_name || 'No author set'}</small></div><span className="health-admin__date">{new Date(article.updated_at).toLocaleDateString()}</span>
          </Link>)}
          {!pageLoading && !articles.length ? <div className="health-admin__empty"><h2>No articles yet</h2><p>Create the first draft for the Health Hub.</p></div> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="admin-shell health-admin">
      <div className="health-admin__editor-top"><div className="health-admin__editor-links"><Link to="/admin/health-hub">← All articles</Link><Link className="admin-button admin-button--ghost" to="/admin">Back to dashboard</Link></div><span className={`health-admin__status health-admin__status--${status}`}>{status.replace('_', ' ')}</span></div>
      <div className="health-admin__top"><div><p className="admin-kicker">{isEditing ? 'Edit article' : 'New article'}</p><h1>{draft.title || 'Write for the Health Hub'}</h1></div><button type="button" className="admin-button admin-button--ghost" onClick={() => setPreview((current) => !current)}>{preview ? 'Edit article' : 'Preview article'}</button></div>
      {pageLoading ? <p className="admin-helper">Loading article...</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}
      {message ? <p className="admin-helper">{message}</p> : null}

      {preview ? <article className="health-admin__preview">
        {draft.coverImageUrl ? <CreditedImage className="health-admin__preview-cover" src={draft.coverImageUrl} alt="Cover image" credit={draft.coverImageIsOurs ? '' : draft.coverImageCredit} sourceUrl={draft.coverImageIsOurs ? '' : draft.coverImageSourceUrl} loading="eager" /> : null}
        <p className="health-kicker">{categories.find((item) => item.id === draft.categoryId)?.name || 'Health Hub'}</p>
        <h1>{draft.title || 'Article title'}</h1><p className="health-admin__preview-summary">{draft.summary}</p>
        <MarkdownContent content={draft.body} />
      </article> : <form className="health-admin__form" onSubmit={(event) => saveArticle(event, 'draft')}>
        <label><span>Article title</span><input value={draft.title} onChange={(event) => updateField('title', event.target.value)} required /></label>
        <div className="health-admin__form-grid">
          <label><span>URL slug</span><input value={draft.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="created-from-title-if-empty" /></label>
          <div className="health-admin__category-picker"><label><span>Category</span><select value={draft.categoryId} onChange={(event) => updateField('categoryId', event.target.value)} required><option value="">Choose a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><button type="button" className="health-admin__add-category" onClick={() => setShowCategoryForm((current) => !current)}>{showCategoryForm ? 'Close' : '+ Add category'}</button></div>
        </div>
        {showCategoryForm ? <div className="health-admin__new-category"><label><span>Category name</span><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={100} required /></label><label><span>Description <small>(optional)</small></span><input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} maxLength={300} /></label><button className="admin-button" type="button" disabled={savingCategory || !categoryName.trim()} onClick={() => createCategory()}>{savingCategory ? 'Adding…' : 'Create category'}</button></div> : null}
        <label><span>Short summary</span><textarea rows="3" maxLength="500" value={draft.summary} onChange={(event) => updateField('summary', event.target.value)} placeholder="A concise introduction for article cards and search results." /></label>
        <label><span>Author name</span><input value={draft.authorName} onChange={(event) => updateField('authorName', event.target.value)} placeholder="Author or Mediscripts editorial team" /></label>

        <div className="health-admin__image-field"><div><strong>Cover image</strong><span>Shown at the top of the article and on article cards.</span></div><input ref={coverInputRef} type="file" accept="image/*" onChange={(event) => handleCoverImage(event.target.files?.[0])} /><button type="button" className="admin-button admin-button--ghost" onClick={() => coverInputRef.current?.click()} disabled={uploadingImage}>{draft.coverImageUrl ? 'Replace cover image' : 'Choose cover image'}</button>{draft.coverImageUrl ? <CreditedImage className="health-admin__cover-preview" src={draft.coverImageUrl} alt="Cover preview" credit={draft.coverImageIsOurs ? '' : draft.coverImageCredit} sourceUrl={draft.coverImageIsOurs ? '' : draft.coverImageSourceUrl} /> : null}<label className="health-admin__ownership"><input type="checkbox" checked={!draft.coverImageIsOurs} onChange={(event) => updateField('coverImageIsOurs', !event.target.checked)} /><span>This image is not owned by Mediscripts</span></label>{!draft.coverImageIsOurs ? <div className="health-admin__attribution-fields"><label><span>Image credit</span><input value={draft.coverImageCredit} onChange={(event) => updateField('coverImageCredit', event.target.value)} maxLength={180} placeholder="Photographer or rights holder" /></label><label><span>Source link</span><input type="url" value={draft.coverImageSourceUrl} onChange={(event) => updateField('coverImageSourceUrl', event.target.value)} placeholder="https://…" /></label><small>Add at least a credit or source link; it will appear over the image. Confirm Mediscripts has permission to publish the image.</small></div> : null}</div>

        <label><span>Article body</span><small>Use Markdown: # headings, **bold**, *italic*, - list items, and [link text](https://…). You can also right-click inside this field to insert an image at the cursor.</small>
          <div className="health-admin__body-wrap" onContextMenu={(event) => { event.preventDefault(); if (editorRef.current) cursorPositionRef.current = { start: editorRef.current.selectionStart, end: editorRef.current.selectionEnd }; setContextMenu({ x: event.clientX, y: event.clientY }) }}>
            <div className="health-admin__toolbar"><button type="button" onClick={() => insertAtCursor('# Heading\n')}>Heading</button><button type="button" onClick={() => insertAtCursor('**bold text**')}>Bold</button><button type="button" onClick={() => insertAtCursor('*italic text*')}>Italic</button><button type="button" onClick={() => insertAtCursor('[link text](https://example.com)')}>Link</button><button type="button" onClick={openInlineImagePicker}>Insert image</button></div>
            <textarea ref={editorRef} rows="18" value={draft.body} onClick={(event) => { cursorPositionRef.current = { start: event.target.selectionStart, end: event.target.selectionEnd } }} onKeyUp={(event) => { cursorPositionRef.current = { start: event.target.selectionStart, end: event.target.selectionEnd } }} onSelect={(event) => { cursorPositionRef.current = { start: event.target.selectionStart, end: event.target.selectionEnd } }} onChange={(event) => updateField('body', event.target.value)} placeholder="Write the article here…" />
            <input ref={imageInputRef} className="health-admin__hidden-file" type="file" accept="image/*" onChange={(event) => { selectInlineImage(event.target.files?.[0]); event.target.value = '' }} />
            {pendingInlineImage ? <div className="health-admin__inline-attribution"><strong>Image details · {pendingInlineImage.name}</strong><label><span>Image description (alt text)</span><input value={inlineImageAlt} onChange={(event) => setInlineImageAlt(event.target.value)} maxLength={250} placeholder="Describe what is visible" /></label><label className="health-admin__ownership"><input type="checkbox" checked={!inlineImageIsOurs} onChange={(event) => setInlineImageIsOurs(!event.target.checked)} /><span>This image is not owned by Mediscripts</span></label>{!inlineImageIsOurs ? <div className="health-admin__attribution-fields"><label><span>Image credit</span><input value={inlineImageCredit} onChange={(event) => setInlineImageCredit(event.target.value)} maxLength={180} placeholder="Photographer or rights holder" /></label><label><span>Source link</span><input type="url" value={inlineImageSourceUrl} onChange={(event) => setInlineImageSourceUrl(event.target.value)} placeholder="https://…" /></label><small>Add at least a credit or source link; it will show over the image. Confirm Mediscripts has permission to publish the image.</small></div> : null}<div className="health-admin__actions"><button className="admin-button" type="button" disabled={uploadingImage} onClick={insertInlineImage}>{uploadingImage ? 'Uploading…' : 'Upload and insert image'}</button><button className="admin-button admin-button--ghost" type="button" onClick={() => setPendingInlineImage(null)}>Cancel</button></div></div> : null}
            {contextMenu ? <button type="button" className="health-admin__context-action" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={() => { setContextMenu(null); openInlineImagePicker() }}>Insert image here</button> : null}
          </div>
        </label>

        <div className="health-admin__review-panel"><div><p className="admin-kicker">Clinical review</p><h2>Approval before publishing</h2><p>Only publish medical education after a qualified pharmacist or appropriate clinician has reviewed this version.</p></div><label><span>Reviewer name</span><input value={draft.reviewerName} onChange={(event) => updateField('reviewerName', event.target.value)} placeholder="Qualified pharmacist or clinician" /></label><label className="health-admin__confirm"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>I confirm this exact version has been reviewed by the named qualified professional.</span></label></div>

        <div className="health-admin__form-grid"><label><span>SEO title</span><input value={draft.seoTitle} onChange={(event) => updateField('seoTitle', event.target.value)} /></label><label><span>SEO description</span><textarea rows="2" maxLength="320" value={draft.seoDescription} onChange={(event) => updateField('seoDescription', event.target.value)} /></label></div>
        <div className="health-admin__actions"><button className="admin-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save draft'}</button><button className="admin-button admin-button--ghost" type="button" disabled={saving} onClick={(event) => saveArticle(event, 'in_review')}>Send for review</button><button className="admin-button admin-button--publish" type="button" disabled={saving} onClick={(event) => saveArticle(event, 'published')}>Publish reviewed article</button></div>
      </form>}
    </main>
  )
}

export default AdminHealthHubPage
