import { supabase } from '../lib/supabaseClient';

export const reviewHelper = {
  getReviewsByProduct: async (productId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getAllReviews: async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  upsertReview: async (review) => {
    // review: { product_id, user_id, rating, comment }
    const { data, error } = await supabase
      .from('reviews')
      .upsert(review, { onConflict: 'product_id,user_id' })
      .select('*, profiles(name)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteReview: async (reviewId) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw new Error(error.message);
    return true;
  }
};
