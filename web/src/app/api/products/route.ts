import { NextResponse } from 'next/server';
import { getProducts, saveProducts } from '@/lib/db';
import { ProductCategory, ProductItem } from '@/lib/types';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, categoryId, categoryData, itemData } = body;
    const products = await getProducts();

    if (type === 'create_category') {
      if (!categoryData || !categoryData.id || !categoryData.name) {
        return NextResponse.json({ success: false, error: 'Invalid category data' }, { status: 400 });
      }
      const existing = products.find((c) => c.id === categoryData.id);
      if (existing) {
        return NextResponse.json({ success: false, error: 'Category ID already exists' }, { status: 400 });
      }
      const newCategory: ProductCategory = {
        id: categoryData.id,
        name: categoryData.name,
        icon: categoryData.icon || 'box',
        items: [],
      };
      products.push(newCategory);
      await saveProducts(products);
      return NextResponse.json({ success: true, data: products });
    }

    if (type === 'create_item') {
      if (!categoryId || !itemData || !itemData.id || !itemData.name) {
        return NextResponse.json({ success: false, error: 'Invalid item data' }, { status: 400 });
      }
      const category = products.find((c) => c.id === categoryId);
      if (!category) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
      }
      const newItem: ProductItem = {
        id: itemData.id,
        name: itemData.name,
        price: Number(itemData.price || 0),
        description: itemData.description || '',
        stock: Array.isArray(itemData.stock) ? itemData.stock : [],
        icon: itemData.icon || category.icon,
      };
      category.items.push(newItem);
      await saveProducts(products);
      return NextResponse.json({ success: true, data: products });
    }

    if (type === 'add_stock') {
      const { itemId, stockItems } = body; // stockItems can be string[] or single string
      if (!categoryId || !itemId || !stockItems) {
        return NextResponse.json({ success: false, error: 'Missing stock update parameters' }, { status: 400 });
      }
      const category = products.find((c) => c.id === categoryId);
      const item = category?.items.find((i) => i.id === itemId);
      if (!item) {
        return NextResponse.json({ success: false, error: 'Product item not found' }, { status: 404 });
      }
      const newStockList = Array.isArray(stockItems)
        ? stockItems.filter((s) => s && s.trim())
        : String(stockItems).split('\n').map((s) => s.trim()).filter(Boolean);
      
      item.stock = [...(item.stock || []), ...newStockList];
      await saveProducts(products);
      return NextResponse.json({ success: true, data: products });
    }

    return NextResponse.json({ success: false, error: 'Invalid request type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update products' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, itemId, itemData, categoryData, fullProducts } = body;

    if (fullProducts && Array.isArray(fullProducts)) {
      await saveProducts(fullProducts);
      return NextResponse.json({ success: true, data: fullProducts });
    }

    const products = await getProducts();

    if (categoryId && !itemId && categoryData) {
      const catIndex = products.findIndex((c) => c.id === categoryId);
      if (catIndex !== -1) {
        const newId = categoryData.id ? categoryData.id.toLowerCase().trim() : categoryId;
        if (newId !== categoryId) {
          const duplicate = products.find((c) => c.id === newId);
          if (duplicate) {
            return NextResponse.json({ success: false, error: `Category ID '${newId}' already exists.` }, { status: 400 });
          }
        }
        products[catIndex] = {
          ...products[catIndex],
          id: newId,
          name: categoryData.name ? categoryData.name.trim() : products[catIndex].name,
          icon: categoryData.icon ? categoryData.icon.trim() : products[catIndex].icon,
        };
        await saveProducts(products);
        return NextResponse.json({ success: true, data: products, updatedCategoryId: newId });
      }
    }

    if (categoryId && itemId && itemData) {
      const category = products.find((c) => c.id === categoryId);
      if (category) {
        const itemIndex = category.items.findIndex((i) => i.id === itemId);
        if (itemIndex !== -1) {
          category.items[itemIndex] = { ...category.items[itemIndex], ...itemData };
          await saveProducts(products);
          return NextResponse.json({ success: true, data: products });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Item/Category not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const itemId = searchParams.get('itemId');

    let products = await getProducts();

    if (categoryId && !itemId) {
      products = products.filter((c) => c.id !== categoryId);
      await saveProducts(products);
      return NextResponse.json({ success: true, data: products });
    }

    if (categoryId && itemId) {
      const category = products.find((c) => c.id === categoryId);
      if (category) {
        category.items = category.items.filter((i) => i.id !== itemId);
        await saveProducts(products);
        return NextResponse.json({ success: true, data: products });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
