<?php

declare(strict_types=1);

namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\GalleryPictures;
use AmzsCMS\GalleryBundle\Entity\Picture;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Vich\UploaderBundle\Storage\StorageInterface;

class MediaLibraryController extends AbstractController
{

//    public function media(Request $request): Response
//    {
//        $eventName = $request->query->get('event');
//        $uuid = $request->query->get('uuid');
//        $eventRegister= $request->get('eventRegister');
//        $blockId = $request->query->get('blockId');
//        $prop = $request->query->get('prop');
//        return $this->render(
//            '@AdminPartials/media_library/open_list_management_modal.html.twig',
//            compact('eventName', 'uuid', 'blockId','eventRegister', 'prop')
//        );
//    }


    public function upload(
        Request $request,
        EntityManagerInterface $em,
        StorageInterface $storage
    ): Response {
        $uploadedFile = $request->files->get('file');

        if (!$uploadedFile) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Không tìm thấy file nào được chọn.'
            ], 400);
        }

        $folderId = (int) $request->request->get('folderId');
        $gallery = null;

        if ($folderId > 0) {
            $gallery = $em->getRepository(Gallery::class)->find($folderId);
        }
        $picture = new Picture();
        if ($gallery) {
            $picture->setGallery($gallery);
        }
        $picture->setFile($uploadedFile);

        try {
            $em->persist($picture);
            $em->flush();

            $galleryPicture = new GalleryPictures();
            $galleryPicture->setPicture($picture);

            if ($gallery) {
                $galleryPicture->setGallery($gallery);
            }

            $imagePath = $storage->resolveUri($picture, 'file');

            if (method_exists($galleryPicture, 'setImage')) {
                $galleryPicture->setImage($imagePath);
            }

            $em->persist($galleryPicture);
            $em->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Tải ảnh và lưu vào thư viện thành công!',
                'id' => $picture->getId(),
                'gallery_picture_id' => $galleryPicture->getId(),
                'image_path' => $imagePath,
                'fileName' => $picture->getFileName(),
            ], 200);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }



}
