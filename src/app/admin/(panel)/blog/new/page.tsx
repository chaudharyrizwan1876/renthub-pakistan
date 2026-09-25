import { PostForm } from "@/components/admin/post-form";
import { requireAdminPage } from "@/lib/authz";

export const metadata = { title: "New article" };

export default async function NewPostPage() {
  await requireAdminPage();
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">New article</h1>
      <PostForm
        id={null}
        defaults={{ title: "", slug: "", excerpt: "", content: "", category: "Guides", authorName: "Pakistan Rents Team", coverImage: "", metaTitle: "", metaDescription: "", published: false }}
      />
    </div>
  );
}
