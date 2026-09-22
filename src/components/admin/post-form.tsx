"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { savePostAction } from "@/actions/blog";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { BLOG_CATEGORY_LIST } from "@/lib/blog-utils";
import { postSchema, type PostFormValues } from "@/lib/blog-schema";

export function PostForm({ id, defaults }: { id: string | null; defaults: PostFormValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<PostFormValues>({ resolver: zodResolver(postSchema), defaultValues: defaults });
  const cover = watch("coverImage");
  const inv = (k: keyof PostFormValues) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "blog");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setValue("coverImage", json.url, { shouldValidate: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function save(publish: boolean | null) {
    return handleSubmit((values) =>
      start(async () => {
        setFormError(null);
        const payload = publish === null ? values : { ...values, published: publish };
        const res = await savePostAction(id, payload);
        if (!res.ok) {
          for (const [k, m] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof PostFormValues, { message: m });
          return setFormError(res.error);
        }
        toast.success(payload.published ? "Article saved and published" : "Draft saved");
        router.push("/admin/blog");
        router.refresh();
      }),
    );
  }

  return (
    <form noValidate onSubmit={save(null)} className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Title" htmlFor="title" error={errors.title?.message} required>
        <Input id="title" {...inv("title")} {...register("title")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="URL slug" htmlFor="slug" error={errors.slug?.message} hint="Leave empty to create it from the title">
          <Input id="slug" placeholder="how-to-rent-a-flat" {...inv("slug")} {...register("slug")} />
        </Field>
        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <Select id="category" {...register("category")}>
            {BLOG_CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Short summary" htmlFor="excerpt" error={errors.excerpt?.message} required hint="Shown on the blog page and in search results (30 to 300 characters)">
        <Textarea id="excerpt" rows={3} className="min-h-20" {...inv("excerpt")} {...register("excerpt")} />
      </Field>
      <Field label="Article (Markdown)" htmlFor="content" error={errors.content?.message} required hint="Use ## for headings, - for bullet lists, **bold**, and [text](https://link) for links.">
        <Textarea id="content" rows={18} className="font-mono text-[13px]" {...inv("content")} {...register("content")} />
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-medium">Cover image (optional)</p>
        <div className="flex flex-wrap items-center gap-3">
          {cover ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="Cover preview" className="h-24 w-40 rounded-lg border border-border object-cover" />
              <Button type="button" variant="ghost" className="text-danger" onClick={() => setValue("coverImage", "")}>
                <Trash2 className="size-4" aria-hidden="true" />Remove
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
              Upload cover
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload cover image" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); e.target.value = ""; }} />
        </div>
        <input type="hidden" {...register("coverImage")} />
        {errors.coverImage && <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{errors.coverImage.message}</p>}
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-semibold">SEO (optional)</legend>
        <Field label="SEO title" htmlFor="metaTitle" error={errors.metaTitle?.message} hint="Up to 70 characters. Empty means the article title is used.">
          <Input id="metaTitle" {...inv("metaTitle")} {...register("metaTitle")} />
        </Field>
        <Field label="SEO description" htmlFor="metaDescription" error={errors.metaDescription?.message} hint="Up to 170 characters. Empty means the summary is used.">
          <Textarea id="metaDescription" rows={2} className="min-h-16" {...inv("metaDescription")} {...register("metaDescription")} />
        </Field>
        <Field label="Author name" htmlFor="authorName" error={errors.authorName?.message}>
          <Input id="authorName" {...inv("authorName")} {...register("authorName")} />
        </Field>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="lg" disabled={pending} onClick={save(false)}>Save as draft</Button>
        <Button type="button" size="lg" disabled={pending} onClick={save(true)}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Publish
        </Button>
      </div>
    </form>
  );
}
