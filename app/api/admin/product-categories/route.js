import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession, getAdminUnauthorizedResponse } from "../../../../lib/admin-session";
import {
    createProductCategory,
    createProductSubcategory,
    deleteProductCategory,
    deleteProductSubcategory,
    getAllProductCategories,
    updateProductCategory,
    updateProductSubcategory,
} from "../../../../lib/product-category-store";

export async function GET() {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    const categories = await getAllProductCategories();
    return NextResponse.json({
        ok: true,
        categories,
    });
}

export async function POST(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const payload = await request.json();
        const categories =
            payload.type === "subcategory"
                ? await createProductSubcategory(payload.categoryId, { name: payload.name })
                : await createProductCategory({ name: payload.name, image: payload.image });

        revalidatePath("/", "layout");
        revalidatePath("/", "page");
        revalidatePath("/produtos", "page");

        return NextResponse.json({
            ok: true,
            categories,
        });
    } catch (error) {
        console.log("[AdminProductCategories] Failed to create category data.", error);
        return NextResponse.json(
            {
                ok: false,
                message:
                    error.message === "Category not found."
                        ? "A categoria informada não foi encontrada."
                        : error.message === "Category name is required."
                          ? "Informe o nome da categoria."
                          : error.message === "Subcategory name is required."
                            ? "Informe o nome da subcategoria."
                            : "Não foi possível salvar a categoria.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const payload = await request.json();
        const categories =
            payload.type === "subcategory"
                ? await updateProductSubcategory(payload.subcategoryId, {
                      categoryId: payload.categoryId,
                      name: payload.name,
                  })
                : await updateProductCategory(payload.categoryId, {
                      categoryName: payload.categoryName,
                      image: payload.image,
                  });

        revalidatePath("/", "layout");
        revalidatePath("/", "page");
        revalidatePath("/produtos", "page");

        return NextResponse.json({
            ok: true,
            categories,
        });
    } catch (error) {
        console.log("[AdminProductCategories] Failed to update category data.", error);
        return NextResponse.json(
            {
                ok: false,
                message:
                    error.message === "Category not found."
                        ? "A categoria informada não foi encontrada."
                        : error.message === "Subcategory not found."
                          ? "A subcategoria informada não foi encontrada."
                          : error.message === "Category name already exists."
                            ? "Já existe uma categoria com esse nome."
                            : error.message === "Subcategory name already exists."
                              ? "Já existe uma subcategoria com esse nome nessa categoria."
                        : "Não foi possível atualizar a categoria.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const subcategoryId = searchParams.get("subcategoryId");
        const categories = categoryId ? await deleteProductCategory(categoryId) : await deleteProductSubcategory(subcategoryId);

        revalidatePath("/", "layout");
        revalidatePath("/", "page");
        revalidatePath("/produtos", "page");

        return NextResponse.json({
            ok: true,
            categories,
        });
    } catch (error) {
        console.log("[AdminProductCategories] Failed to delete category data.", error);
        return NextResponse.json(
            {
                ok: false,
                message:
                    error.message === "Category is in use by products."
                        ? "Esta categoria já está em uso por produtos cadastrados."
                        : error.message === "Subcategory is in use by products."
                          ? "Esta subcategoria já está em uso por produtos cadastrados."
                          : error.message === "Category not found."
                            ? "A categoria informada não foi encontrada."
                            : error.message === "Subcategory not found."
                              ? "A subcategoria informada não foi encontrada."
                              : "Não foi possível remover o cadastro.",
            },
            { status: 500 }
        );
    }
}
