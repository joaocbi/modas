import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { getAllProducts, isAdminMutationEnabled } from "./product-store";

const productCategoriesFilePath = path.join(process.cwd(), "data", "product-categories.json");

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

function isMissingProductCategoryTableError(error) {
    return error?.code === "P2021";
}

function getNormalizedKey(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
}

function sortByName(items) {
    return [...items].sort((leftItem, rightItem) => leftItem.name.localeCompare(rightItem.name, "pt-BR", { sensitivity: "base" }));
}

function normalizeSubcategory(subcategory, id) {
    return {
        id,
        name: String(subcategory?.name || subcategory || "").trim(),
    };
}

function normalizeCategory(category, id) {
    const uniqueSubcategories = new Map();

    (category?.subcategories || []).forEach((subcategory, index) => {
        const normalizedSubcategory = normalizeSubcategory(subcategory, Number(subcategory?.id) || index + 1);
        const normalizedKey = getNormalizedKey(normalizedSubcategory.name);

        if (normalizedSubcategory.name && !uniqueSubcategories.has(normalizedKey)) {
            uniqueSubcategories.set(normalizedKey, normalizedSubcategory);
        }
    });

    return {
        id,
        name: String(category?.name || "").trim(),
        image: String(category?.image || "").trim(),
        subcategories: sortByName([...uniqueSubcategories.values()]),
    };
}

function mapDatabaseCategory(category) {
    return {
        id: category.id,
        name: category.name,
        image: category.image,
        subcategories: sortByName(
            category.subcategories.map((subcategory) => ({
                id: subcategory.id,
                name: subcategory.name,
            }))
        ),
    };
}

function mergeCategoryCollections(...collections) {
    const mergedCategories = new Map();
    let nextCategoryId = 1;
    let nextSubcategoryId = 1;

    collections.flat().forEach((category) => {
        const normalizedCategory = normalizeCategory(category, Number(category?.id) || nextCategoryId);
        const categoryKey = getNormalizedKey(normalizedCategory.name);

        if (!normalizedCategory.name) {
            return;
        }

        if (!mergedCategories.has(categoryKey)) {
            mergedCategories.set(categoryKey, {
                id: Number(category?.id) || nextCategoryId,
                name: normalizedCategory.name,
                image: normalizedCategory.image,
                subcategories: [],
            });
            nextCategoryId += 1;
        }

        const mergedCategory = mergedCategories.get(categoryKey);
        const subcategoryMap = new Map(mergedCategory.subcategories.map((subcategory) => [getNormalizedKey(subcategory.name), subcategory]));

        normalizedCategory.subcategories.forEach((subcategory) => {
            const subcategoryKey = getNormalizedKey(subcategory.name);

            if (!subcategory.name || subcategoryMap.has(subcategoryKey)) {
                return;
            }

            const nextId = Number(subcategory.id) || nextSubcategoryId;
            subcategoryMap.set(subcategoryKey, {
                id: nextId,
                name: subcategory.name,
            });
            nextSubcategoryId = Math.max(nextSubcategoryId, nextId + 1);
        });

        if (normalizedCategory.image) {
            mergedCategory.image = normalizedCategory.image;
        }

        mergedCategory.subcategories = sortByName([...subcategoryMap.values()]);
        nextCategoryId = Math.max(nextCategoryId, Number(mergedCategory.id) + 1);
    });

    return sortByName([...mergedCategories.values()]);
}

function deriveCategoriesFromProducts(products) {
    const derivedCategories = new Map();

    products.forEach((product) => {
        const categoryName = String(product.category || "").trim();
        const subcategoryName = String(product.subcategory || "").trim();

        if (!categoryName) {
            return;
        }

        const categoryKey = getNormalizedKey(categoryName);

        if (!derivedCategories.has(categoryKey)) {
            derivedCategories.set(categoryKey, {
                id: derivedCategories.size + 1,
                name: categoryName,
                image: "",
                subcategories: [],
            });
        }

        if (!subcategoryName) {
            return;
        }

        const category = derivedCategories.get(categoryKey);
        const existingSubcategory = category.subcategories.find(
            (subcategory) => getNormalizedKey(subcategory.name) === getNormalizedKey(subcategoryName)
        );

        if (!existingSubcategory) {
            category.subcategories.push({
                id: category.subcategories.length + 1,
                name: subcategoryName,
            });
        }
    });

    return sortByName([...derivedCategories.values()]).map((category) => ({
        ...category,
        subcategories: sortByName(category.subcategories),
    }));
}

async function readProductCategoriesFromFile() {
    try {
        const fileContents = await fs.readFile(productCategoriesFilePath, "utf8");
        return JSON.parse(fileContents);
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }
}

async function saveProductCategories(categories) {
    await fs.writeFile(productCategoriesFilePath, JSON.stringify(categories, null, 2), "utf8");
    console.log("[ProductCategoryStore] Saved product categories.", { count: categories.length });
}

async function buildMergedProductCategories(categories) {
    const products = await getAllProducts();
    return mergeCategoryCollections(categories, deriveCategoriesFromProducts(products));
}

export async function getAllProductCategories() {
    if (hasDatabaseUrl()) {
        try {
            const categories = await prisma.productCategory.findMany({
                orderBy: {
                    name: "asc",
                },
                include: {
                    subcategories: {
                        orderBy: {
                            name: "asc",
                        },
                    },
                },
            });

            console.log("[ProductCategoryStore] Loaded product categories from database.", { count: categories.length });
            return buildMergedProductCategories(categories.map(mapDatabaseCategory));
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }

            console.log("[ProductCategoryStore] Product category tables not found. Falling back to file storage.");
        }
    }

    const categories = await readProductCategoriesFromFile();
    console.log("[ProductCategoryStore] Loaded product categories from file fallback.", { count: categories.length });
    return buildMergedProductCategories(categories);
}

function assertCategoryName(name) {
    if (!String(name || "").trim()) {
        throw new Error("Category name is required.");
    }
}

function assertSubcategoryName(name) {
    if (!String(name || "").trim()) {
        throw new Error("Subcategory name is required.");
    }
}

export async function createProductCategory(input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const categoryName = String(input?.name || "").trim();
    const categoryImage = String(input?.image || "").trim();
    assertCategoryName(categoryName);
    const existingCategories = await getAllProductCategories();
    const existingCategory = existingCategories.find((category) => getNormalizedKey(category.name) === getNormalizedKey(categoryName));

    if (existingCategory) {
        if (categoryImage && categoryImage !== existingCategory.image) {
            return updateProductCategory(existingCategory.id, {
                categoryName,
                image: categoryImage,
            });
        }

        return existingCategories;
    }

    if (hasDatabaseUrl()) {
        try {
            await prisma.productCategory.create({
                data: {
                    name: categoryName,
                    image: categoryImage,
                },
            });

            return getAllProductCategories();
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }
        }
    }

    const categories = await readProductCategoriesFromFile();
    const nextId = categories.reduce((largestId, category) => Math.max(largestId, Number(category.id) || 0), 0) + 1;
    await saveProductCategories([...categories, normalizeCategory({ name: categoryName, image: categoryImage, subcategories: [] }, nextId)]);
    return getAllProductCategories();
}

export async function updateProductCategory(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedId = Number(id);
    const categoryName = String(input?.categoryName || input?.name || "").trim();
    const categoryImage = String(input?.image || "").trim();

    if (hasDatabaseUrl()) {
        try {
            let category =
                normalizedId > 0
                    ? await prisma.productCategory.findUnique({
                          where: {
                              id: normalizedId,
                          },
                      })
                    : null;

            if (!category && categoryName) {
                await createProductCategory({ name: categoryName });
                category = await prisma.productCategory.findFirst({
                    where: {
                        name: categoryName,
                    },
                });
            }

            if (!category) {
                throw new Error("Category not found.");
            }

            await prisma.productCategory.update({
                where: {
                    id: category.id,
                },
                data: {
                    image: categoryImage,
                },
            });

            return getAllProductCategories();
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }
        }
    }

    const categories = await readProductCategoriesFromFile();
    let categoryIndex = categories.findIndex((category) => Number(category.id) === normalizedId);

    if (categoryIndex < 0 && categoryName) {
        const existingByNameIndex = categories.findIndex((category) => getNormalizedKey(category.name) === getNormalizedKey(categoryName));

        if (existingByNameIndex >= 0) {
            categoryIndex = existingByNameIndex;
        } else {
            await createProductCategory({ name: categoryName });
            const refreshedCategories = await readProductCategoriesFromFile();
            categoryIndex = refreshedCategories.findIndex((category) => getNormalizedKey(category.name) === getNormalizedKey(categoryName));

            if (categoryIndex >= 0) {
                categories.splice(0, categories.length, ...refreshedCategories);
            }
        }
    }

    if (categoryIndex < 0) {
        throw new Error("Category not found.");
    }

    const currentCategory = normalizeCategory(categories[categoryIndex], Number(categories[categoryIndex].id) || normalizedId);
    const nextCategories = [...categories];
    nextCategories[categoryIndex] = {
        ...currentCategory,
        image: categoryImage,
    };
    await saveProductCategories(nextCategories);
    return getAllProductCategories();
}

export async function createProductSubcategory(categoryId, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedCategoryId = Number(categoryId);
    const subcategoryName = String(input?.name || "").trim();
    const categoryName = String(input?.categoryName || "").trim();
    assertSubcategoryName(subcategoryName);

    if (hasDatabaseUrl()) {
        try {
            let category =
                normalizedCategoryId > 0
                    ? await prisma.productCategory.findUnique({
                          where: {
                              id: normalizedCategoryId,
                          },
                          include: {
                              subcategories: true,
                          },
                      })
                    : null;

            if (!category && categoryName) {
                await createProductCategory({ name: categoryName });
                category = await prisma.productCategory.findFirst({
                    where: {
                        name: categoryName,
                    },
                    include: {
                        subcategories: true,
                    },
                });
            }

            if (!category) {
                throw new Error("Category not found.");
            }

            const alreadyExists = category.subcategories.some(
                (subcategory) => getNormalizedKey(subcategory.name) === getNormalizedKey(subcategoryName)
            );

            if (!alreadyExists) {
                await prisma.productSubcategory.create({
                    data: {
                        name: subcategoryName,
                        categoryId: category.id,
                    },
                });
            }

            return getAllProductCategories();
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }
        }
    }

    const categories = await readProductCategoriesFromFile();
    let categoryIndex = categories.findIndex((category) => Number(category.id) === normalizedCategoryId);

    if (categoryIndex < 0 && categoryName) {
        await createProductCategory({ name: categoryName });
        const refreshedCategories = await readProductCategoriesFromFile();
        categoryIndex = refreshedCategories.findIndex((category) => getNormalizedKey(category.name) === getNormalizedKey(categoryName));

        if (categoryIndex >= 0) {
            categories.splice(0, categories.length, ...refreshedCategories);
        }
    }

    if (categoryIndex < 0) {
        throw new Error("Category not found.");
    }

    const category = normalizeCategory(categories[categoryIndex], normalizedCategoryId);
    const alreadyExists = category.subcategories.some(
        (subcategory) => getNormalizedKey(subcategory.name) === getNormalizedKey(subcategoryName)
    );

    if (!alreadyExists) {
        const nextSubcategoryId = categories.reduce(
            (largestId, currentCategory) =>
                Math.max(
                    largestId,
                    ...(currentCategory.subcategories || []).map((subcategory) => Number(subcategory.id) || 0)
                ),
            0
        ) + 1;

        const nextCategories = [...categories];
        nextCategories[categoryIndex] = {
            ...category,
            subcategories: sortByName([...category.subcategories, { id: nextSubcategoryId, name: subcategoryName }]),
        };
        await saveProductCategories(nextCategories);
    }

    return getAllProductCategories();
}

export async function syncProductCategoryOption(categoryName, subcategoryName) {
    const normalizedCategoryName = String(categoryName || "").trim();
    const normalizedSubcategoryName = String(subcategoryName || "").trim();

    if (!normalizedCategoryName) {
        return getAllProductCategories();
    }

    const categories = await getAllProductCategories();
    const existingCategory = categories.find((category) => getNormalizedKey(category.name) === getNormalizedKey(normalizedCategoryName));
    let nextCategories = categories;

    if (!existingCategory) {
        nextCategories = await createProductCategory({ name: normalizedCategoryName });
    }

    if (!normalizedSubcategoryName) {
        return nextCategories;
    }

    const category = nextCategories.find((item) => getNormalizedKey(item.name) === getNormalizedKey(normalizedCategoryName));

    if (!category) {
        return nextCategories;
    }

    const subcategoryExists = category.subcategories.some(
        (subcategory) => getNormalizedKey(subcategory.name) === getNormalizedKey(normalizedSubcategoryName)
    );

    if (subcategoryExists) {
        return nextCategories;
    }

    return createProductSubcategory(category.id, { name: normalizedSubcategoryName });
}

export async function deleteProductCategory(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedId = Number(id);
    const categories = await getAllProductCategories();
    const category = categories.find((item) => Number(item.id) === normalizedId);

    if (!category) {
        throw new Error("Category not found.");
    }

    const products = await getAllProducts();
    const isCategoryInUse = products.some((product) => getNormalizedKey(product.category) === getNormalizedKey(category.name));

    if (isCategoryInUse) {
        throw new Error("Category is in use by products.");
    }

    if (hasDatabaseUrl()) {
        try {
            await prisma.productCategory.delete({
                where: {
                    id: normalizedId,
                },
            });

            return getAllProductCategories();
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }
        }
    }

    const fileCategories = await readProductCategoriesFromFile();
    await saveProductCategories(fileCategories.filter((item) => Number(item.id) !== normalizedId));
    return getAllProductCategories();
}

export async function deleteProductSubcategory(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedId = Number(id);
    const categories = await getAllProductCategories();
    const category = categories.find((item) => item.subcategories.some((subcategory) => Number(subcategory.id) === normalizedId));
    const subcategory = category?.subcategories.find((item) => Number(item.id) === normalizedId);

    if (!category || !subcategory) {
        throw new Error("Subcategory not found.");
    }

    const products = await getAllProducts();
    const isSubcategoryInUse = products.some(
        (product) =>
            getNormalizedKey(product.category) === getNormalizedKey(category.name) &&
            getNormalizedKey(product.subcategory) === getNormalizedKey(subcategory.name)
    );

    if (isSubcategoryInUse) {
        throw new Error("Subcategory is in use by products.");
    }

    if (hasDatabaseUrl()) {
        try {
            await prisma.productSubcategory.delete({
                where: {
                    id: normalizedId,
                },
            });

            return getAllProductCategories();
        } catch (error) {
            if (!isMissingProductCategoryTableError(error)) {
                throw error;
            }
        }
    }

    const fileCategories = await readProductCategoriesFromFile();
    const nextCategories = fileCategories.map((item) =>
        Number(item.id) === Number(category.id)
            ? {
                  ...item,
                  subcategories: (item.subcategories || []).filter((currentSubcategory) => Number(currentSubcategory.id) !== normalizedId),
              }
            : item
    );
    await saveProductCategories(nextCategories);
    return getAllProductCategories();
}
